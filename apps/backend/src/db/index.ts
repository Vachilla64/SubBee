import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config';

// Initialize the database client pool
// DATABASE_URL is validated at boot time in config.ts
const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 20, // default max clients in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('[db/pool] Unexpected database client error:', err);
});

export const db = {
  /**
   * Executes a database query using a client from the pool
   */
  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const res = await pool.query<T>(text, params);
      const duration = Date.now() - start;
      if (config.NODE_ENV === 'development') {
        console.log('[db/query]', { text: text.trim().substring(0, 100), duration: `${duration}ms`, rows: res.rowCount });
      }
      return res;
    } catch (error) {
      console.error('[db/query] Error executing query:', { text, error });
      throw error;
    }
  },

  /**
   * Runs queries within a safe SQL transaction block.
   * Handles automatic BEGIN, COMMIT, and ROLLBACK.
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[db/transaction] Transaction failed, rolled back.', error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Shuts down pool connections safely
   */
  async close(): Promise<void> {
    await pool.end();
    console.log('[db] Client pool ended.');
  }
};
