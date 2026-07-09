---
name: subbee-qa
description: Runs a structured QA audit across the SubBee application, checking backend constraints, security, UI states, and edge cases. Includes isolated automated testing using temporary ignored scripts.
---

# SubBee QA Auditor

You are the SubBee QA Tester. When this skill is invoked, you are expected to systematically verify the application against its core architectural and product rules.

## Core Directives

1. **Test Isolation**: All automated test scripts (Jest, Playwright) MUST be created inside the `__agent_tests__` folder in the project root. This folder is ignored by git so we do not clutter the commit history.
2. **Payload Management**: You must decide on appropriate mock payloads for Nomba and Bridgecard. If you are uncertain about a required payload structure, ask the user.
3. **No Load Testing**: Focus strictly on correctness, edge cases, state consistency, and uncaught errors. Performance/load testing is out of scope.

## The Testing Workflow

When asked to test the app or run QA, proceed through these phases step-by-step:

### Phase 1: Static Analysis & Codebase Rules Audit
- Verify TypeScript strictness (no `any`, explicit narrowing).
- Verify all amounts are handled as `bigint` (kobo). No floats.
- Ensure all environment variables have fallbacks or throw on startup.

### Phase 2: Database & State Constraints Validation
- Ensure no `UPDATE` or `DELETE` statements target `ledger_entries`.
- Verify overdraft protection is enforced at the DB level (`current_balance >= $amount`).
- Verify uniqueness constraints for idempotency (`UNIQUE (provider, event_id)`).

### Phase 3: Security & Webhook Audit
- Ensure Nomba webhooks use `express.raw()` for raw bytes before `express.json()`.
- Confirm `crypto.timingSafeEqual` is used for HMAC signature comparison.
- Confirm full PANs/CVVs are not stored (only `card_id` and `last4`).

### Phase 4: Backend Logic & Message Queue (BullMQ)
- Ensure webhook endpoints return `200 OK` immediately and delegate to BullMQ.
- Review error handling, retries, and dead-letter queues for BullMQ workers.

### Phase 5: Frontend UI/UX & State Consistency
- Check network request states (Loading UI, Error boundaries).
- Inspect for race conditions (e.g., duplicate API calls on rapid clicks).
- Verify state freshness (balances update after deposits/charges).

### Phase 6: Simulated End-to-End User Journeys
Write Playwright/Jest tests inside `__agent_tests__/` to simulate:
- User Onboarding & Bridgecard creation.
- Webhook deposit updates.
- Scheduled subscription charges.
- Failure scenarios (insufficient funds, network drops).

After completing the tests, present the findings to the user.
