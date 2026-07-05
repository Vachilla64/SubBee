/**
 * SubBee Backend — Express server (M0 skeleton)
 *
 * Architecture notes (from implementation blueprint):
 *  - Webhook routes use express.raw() BEFORE express.json() so the HMAC is
 *    computed over the original byte stream. Re-serialising parsed JSON can
 *    reorder keys / change whitespace and break the signature comparison.
 *  - crypto.timingSafeEqual prevents timing attacks on the HMAC comparison.
 *  - Webhooks acknowledge 200 immediately; all heavy work is enqueued.
 */

import "dotenv/config";
import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import crypto from "crypto";

// ─── Environment ──────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? "3000", 10);

/**
 * NOMBA_WEBHOOK_SECRET is the "Signature Key" shown in the Nomba dashboard
 * when configuring a webhook endpoint. It is the HMAC key, not the OAuth
 * client secret. Keep them separate in your .env.
 *
 * We fall back to a known test value so the skeleton boots in a bare
 * environment during local development.
 */
const NOMBA_WEBHOOK_SECRET =
  process.env.NOMBA_WEBHOOK_SECRET ?? "NombaHackathon2026";

// ─── App factory ──────────────────────────────────────────────────────────────

const app: Application = express();

// ─── Global middleware ────────────────────────────────────────────────────────

app.use(cors());

/**
 * express.json() is the default body parser for all non-webhook routes.
 * We mount it AFTER the webhook router so the raw-body middleware on
 * /webhooks/* takes precedence on those paths.
 *
 * Order matters: Express matches middleware in registration order.
 */
// (mounted after webhook routes — see below)

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "SubBee API",
    version: "0.1.0",
    milestone: "M0 — skeleton",
    timestamp: new Date().toISOString(),
  });
});

// ─── Nomba webhook receiver ───────────────────────────────────────────────────
//
// CRITICAL: express.raw() is mounted on this single route, NOT globally.
// This means req.body is a Buffer here, giving us the original bytes for HMAC.
//
// Nomba signs with HMAC-SHA512. The signature header name is "x-nomba-signature"
// — verify this against the live dashboard during integration (Section 7.1).
//
// Flow:
//  1. Verify HMAC (raw bytes)       → 401 on failure
//  2. Idempotency guard             → 200 early-return on duplicate (TODO: DB)
//  3. Acknowledge 200 immediately
//  4. Enqueue processing job        → (TODO: BullMQ worker)

app.post(
  "/webhooks/nomba",
  express.raw({ type: "application/json" }),
  (req: Request, res: Response) => {
    const incomingSignature = (req.headers["nomba-signature"] ??
      req.headers["x-nomba-signature"]) as string | undefined;

    if (!incomingSignature) {
      console.warn("[webhook/nomba] Missing nomba-signature or x-nomba-signature header — 401");
      res.status(401).json({ error: "Missing signature header" });
      return;
    }

    // req.body is a Buffer because of express.raw() above
    const rawBody = req.body as Buffer;

    // Compute HMAC-SHA512 over the *raw byte buffer* using our secret key
    const computedHmac = crypto
      .createHmac("sha512", NOMBA_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    // timingSafeEqual prevents timing attacks — both buffers must be the same
    // length before comparison, otherwise it throws
    let isValid = false;
    try {
      const sigBuffer = Buffer.from(incomingSignature, "hex");
      const computedBuffer = Buffer.from(computedHmac, "hex");
      // Buffers must be the same byte-length for timingSafeEqual
      isValid =
        sigBuffer.length === computedBuffer.length &&
        crypto.timingSafeEqual(sigBuffer, computedBuffer);
    } catch {
      // Malformed hex in the incoming signature — treat as invalid
      isValid = false;
    }

    if (!isValid) {
      console.warn("[webhook/nomba] Invalid HMAC signature — 401");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // ── Step 2: Parse payload (safe now that signature is verified) ───────────

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody.toString("utf-8")) as Record<
        string,
        unknown
      >;
    } catch {
      console.error("[webhook/nomba] Non-JSON payload after valid signature");
      res.status(400).json({ error: "Invalid JSON payload" });
      return;
    }

    /**
     * Idempotency key:
     *   Use Nomba's transactionId as the stable event ID — it remains constant
     *   across redelivery attempts. Fall back to requestId if not present.
     *   The DB layer will enforce UNIQUE(provider, event_id) with ON CONFLICT
     *   DO NOTHING (see Section 5.2 data model: webhook_events table).
     *
     * TODO (M1): Replace this log with the actual DB insert + queue enqueue.
     */
    const data = payload["data"] as Record<string, unknown> | undefined;
    const transaction = data?.["transaction"] as
      Record<string, unknown> | undefined;
    const eventId =
      (transaction?.["transactionId"] as string | undefined) ??
      (payload["requestId"] as string | undefined) ??
      "unknown";

    const eventType = (payload["eventType"] as string | undefined) ?? "unknown";

    console.log("[webhook/nomba] ✅ Valid webhook received", {
      eventType,
      eventId,
      timestamp: new Date().toISOString(),
    });

    // ── Step 3: Acknowledge immediately (before any slow work) ────────────────
    //
    // Slow handlers cause Nomba to retry, which causes more duplicates.
    // The 200 goes out here; the BullMQ worker does the ledger update.
    res.status(200).json({ received: true });

    // ── Step 4: Enqueue (TODO M1 — BullMQ queue.add) ─────────────────────────
    // depositQueue.add('process-deposit', { eventId, eventType, payload });
  },
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
