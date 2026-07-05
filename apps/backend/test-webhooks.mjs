// test-webhook.mjs  — run with: node test-webhook.mjs
import crypto from "crypto";

const WEBHOOK_URL = "https://subbee3712.up.railway.app/webhooks/nomba";

// Must match NOMBA_WEBHOOK_SECRET on Railway.
const SECRET = "NombaHackathon2026";

const payload = {
  eventType: "payment_success",
  requestId: `test-${Date.now()}`,
  data: {
    transaction: {
      transactionId: `txn_${crypto.randomUUID()}`,
      amount: 500000, // ₦5,000 in kobo
      currency: "NGN",
      status: "SUCCESS",
      accountRef: "test-user-001",
    },
  },
};

const body = JSON.stringify(payload);

// Generate a valid HMAC-SHA512 signature over the raw body
const signature = crypto
  .createHmac("sha512", SECRET)
  .update(Buffer.from(body, "utf-8"))
  .digest("hex");

const response = await fetch(WEBHOOK_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-nomba-signature": signature, // <-- this is what was missing in your curl
  },
  body,
});

console.log("Status:", response.status);
console.log("Body:", await response.text());
// 200 = HMAC verified ✅
// 401 = secret mismatch ❌
