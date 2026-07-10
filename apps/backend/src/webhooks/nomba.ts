import { Router, Request, Response } from "express";
import express from "express";
import crypto from "crypto";
import { db } from "../db";
import { config } from "../config";
import { depositQueue, withdrawalQueue } from "../workers/queue";

const nombaWebhookRouter: Router = Router();

nombaWebhookRouter.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response): Promise<void> => {
    // ── Step 1: signature verification ────────────────────────────────────────
    const incomingSignature = (req.headers["nomba-signature"] ??
      req.headers["x-nomba-signature"]) as string | undefined;

    if (!incomingSignature) {
      console.warn("[webhook/nomba] Missing signature header — 401");
      res.status(401).json({ error: "Missing signature header" });
      return;
    }

    const rawBody = req.body as Buffer;
    const computedHmac = crypto
      .createHmac("sha512", config.NOMBA_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    let isValid = false;
    try {
      const sigBuffer = Buffer.from(incomingSignature, "hex");
      const computedBuffer = Buffer.from(computedHmac, "hex");
      isValid =
        sigBuffer.length === computedBuffer.length &&
        crypto.timingSafeEqual(sigBuffer, computedBuffer);
    } catch {
      isValid = false;
    }

    if (!isValid) {
      console.warn("[webhook/nomba] Invalid HMAC signature — 401");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // ── Step 2: Parse payload ─────────────────────────────────────────────────
    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString("utf-8"));
    } catch {
      res.status(400).json({ error: "Invalid JSON payload" });
      return;
    }

    const data = payload["data"];
    const transaction = data?.["transaction"];
    const eventId =
      transaction?.["transactionId"] ?? payload["requestId"] ?? "unknown";
    // Nomba's real payloads use snake_case `event_type` — the original deposit
    // handler assumed camelCase, so check both rather than risk "unknown" routing.
    const eventType =
      payload["event_type"] ?? payload["eventType"] ?? "unknown";
    const isPayoutEvent = eventType.startsWith("payout");

    try {
      // ── Step 3: Idempotency check via DB Unique Constraint ───────────────────
      // Saves the event first; does nothing if we already received it.
      const dbInsert = await db.query(
        `INSERT INTO webhook_events (provider, event_id, event_type, raw_payload)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (provider, event_id) DO NOTHING`,
        ["nomba", eventId, eventType, JSON.stringify(payload)],
      );

      if (dbInsert.rowCount === 0) {
        console.log(`[webhook/nomba] Duplicate event ignored: ${eventId}`);
        res.status(200).json({ received: true, duplicate: true });
        return;
      }

      // ── Step 4: Enqueue job to BullMQ ────────────────────────────────────────
      // One shared endpoint receives every subscribed Nomba event type — route
      // outbound transfer events (payout_success/payout_failed/payout_refund) to
      // the withdrawal worker, everything else to the deposit worker as before.
      if (isPayoutEvent) {
        await withdrawalQueue.add("process-payout", { eventId, eventType, payload });
      } else {
        await depositQueue.add("process-deposit", { eventId, eventType, payload });
      }

      console.log("[webhook/nomba] Webhook enqueued successfully", {
        eventId,
        eventType,
      });

      // ── Step 5: Acknowledge Nomba immediately ──────────────────────────────
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error("[webhook/nomba] Error handling webhook:", error);
      res.status(500).json({ error: "Internal processing failure" });
    }
  },
);

export default nombaWebhookRouter;
