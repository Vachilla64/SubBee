/**
 * SubBee Backend — Express server (M1 deposits)
 */

import { config } from './config';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { db } from './db';
import { depositQueue } from './workers/queue';

// Import workers to ensure they register and start listening to Redis
import './workers/deposit.worker';
import './telegram/bot';

const PORT = config.PORT;
const NOMBA_WEBHOOK_SECRET = config.NOMBA_WEBHOOK_SECRET;

const app: Application = express();

app.use(cors());

// Health check
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'SubBee API',
    version: '0.2.0',
    milestone: 'M1 — deposits',
    timestamp: new Date().toISOString(),
  });
});

app.post(
  '/webhooks/nomba',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    // ── Step 1: signature verification ────────────────────────────────────────
    const incomingSignature = (req.headers['nomba-signature'] ??
      req.headers['x-nomba-signature']) as string | undefined;

    if (!incomingSignature) {
      console.warn('[webhook/nomba] Missing signature header — 401');
      res.status(401).json({ error: 'Missing signature header' });
      return;
    }

    const rawBody = req.body as Buffer;
    const computedHmac = crypto
      .createHmac('sha512', NOMBA_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    let isValid = false;
    try {
      const sigBuffer = Buffer.from(incomingSignature, 'hex');
      const computedBuffer = Buffer.from(computedHmac, 'hex');
      isValid =
        sigBuffer.length === computedBuffer.length &&
        crypto.timingSafeEqual(sigBuffer, computedBuffer);
    } catch {
      isValid = false;
    }

    if (!isValid) {
      console.warn('[webhook/nomba] Invalid HMAC signature — 401');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // ── Step 2: Parse payload ─────────────────────────────────────────────────
    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString('utf-8'));
    } catch {
      res.status(400).json({ error: 'Invalid JSON payload' });
      return;
    }

    const data = payload['data'];
    const transaction = data?.['transaction'];
    const eventId =
      transaction?.['transactionId'] ??
      payload['requestId'] ??
      'unknown';
    const eventType = payload['eventType'] ?? 'unknown';

    try {
      // ── Step 3: Idempotency check via DB Unique Constraint ───────────────────
      // Saves the event first; does nothing if we already received it.
      const dbInsert = await db.query(
        `INSERT INTO webhook_events (provider, event_id, event_type, raw_payload) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (provider, event_id) DO NOTHING`,
        ['nomba', eventId, eventType, JSON.stringify(payload)]
      );

      if (dbInsert.rowCount === 0) {
        console.log(`[webhook/nomba] Duplicate event ignored: ${eventId}`);
        res.status(200).json({ received: true, duplicate: true });
        return;
      }

      // ── Step 4: Enqueue job to BullMQ ────────────────────────────────────────
      await depositQueue.add('process-deposit', {
        eventId,
        eventType,
        payload,
      });

      console.log('[webhook/nomba] Webhook enqueued successfully', { eventId, eventType });

      // ── Step 5: Acknowledge Nomba immediately ──────────────────────────────
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('[webhook/nomba] Error handling webhook:', error);
      res.status(500).json({ error: 'Internal processing failure' });
    }
  }
);

// ─── Bridgecard webhook receiver (skeleton — implementation in M2) ────────────

app.post(
  "/webhooks/bridgecard",
  express.raw({ type: "application/json" }),
  (req: Request, res: Response) => {
    /**
     * TODO (M2): Verify Bridgecard's webhook authentication scheme
     * (header name and HMAC vs. static token — check their docs during
     * integration per Section 7.1 of the blueprint).
     *
     * Same pattern as Nomba: raw body → HMAC → idempotency guard → 200 → enqueue.
     */
    const rawBody = req.body as Buffer;
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(rawBody.toString("utf-8")) as Record<
        string,
        unknown
      >;
    } catch {
      res.status(400).json({ error: "Invalid JSON payload" });
      return;
    }

    const eventType = (payload["event"] as string | undefined) ?? "unknown";
    console.log("[webhook/bridgecard] 🔲 Skeleton received (auth TODO)", {
      eventType,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({ received: true });
  },
);

// ─── Global JSON parser (after webhook routes) ────────────────────────────────
//
// Any route registered after this point gets parsed JSON in req.body.
// Webhook routes above use express.raw() instead — they are unaffected.

app.use(express.json());

// ─── 404 fallback ─────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// ─── Global error handler ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[server] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
┌─────────────────────────────────────────────────┐
│              🐝  SubBee API  🐝                  │
│                                                  │
│  Listening on  http://localhost:${PORT}             │
│  Health check  GET  /                            │
│                                                  │
│  Webhook endpoints:                              │
│    POST /webhooks/nomba                          │
│    POST /webhooks/bridgecard  (skeleton)         │
│                                                  │
│  Milestone: M0 — skeleton                        │
└─────────────────────────────────────────────────┘
  `);
});

export default app;
