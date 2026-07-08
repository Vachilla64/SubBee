import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../config';

// Initialize a shared Redis connection for all BullMQ queues and workers
export const redisConnection = new Redis(config.REDIS_URL, {
  // Prevent infinite reconnect loops hanging processes during shutdowns
  maxRetriesPerRequest: null,
});

redisConnection.on('error', (err) => {
  console.error('[redis] Connection error:', err.message);
});

// Initialize the Nomba deposit queue
export const depositQueue = new Queue('deposit-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    // Retry failed jobs 3 times with exponential backoff
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true, // Keep Redis memory footprint small
    removeOnFail: 100, // Keep last 100 failed traces for inspection
  },
});

console.log('[queue] Deposit queue initialized.');

// Initialize the Bridgecard cards webhook queue
export const cardQueue = new Queue('card-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

console.log('[queue] Card queue initialized.');

// Initialize the scheduler queue for recurring subscription jobs
export const schedulerQueue = new Queue('scheduler-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

console.log('[queue] Scheduler queue initialized.');

// Initialize the invariant queue for trust layer checks
export const invariantQueue = new Queue('invariant-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

console.log('[queue] Invariant queue initialized.');

// Initialize the reconciliation queue for float monitoring and sweep-backs
export const reconciliationQueue = new Queue('reconciliation-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: 100,
  },
});

console.log('[queue] Reconciliation queue initialized.');
