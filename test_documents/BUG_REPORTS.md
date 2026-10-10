# Payment Course Project

## Bug Reports

10 confirmed defects identified during testing of the Merchant Payment Service

Required format: Summary • Severity • Steps to Reproduce • Expected Result • Actual Result

## BUG-01

**Summary:** idempotency_key is ignored and duplicate payments are created

**Severity:** High — Reusing the same idempotency key can create multiple PaymentIntents and may lead to duplicate charges for a single intended payment.

**Steps to Reproduce:**

1. Send POST /api/payments with amount = 5000, payment_method = pm_card_visa and idempotency_key = "order-123".

2. Verify that the payment is created successfully.

3. Resend the same request with the same idempotency_key = "order-123".

4. Optionally, reuse the same key again with changed request parameters, for example amount = 6000.

**Expected Result:** The retry must not create a second payment or a second Stripe PaymentIntent. Reusing the same key with different parameters should also be rejected or resolved without creating another payment.

**Actual Result:** A new local payment and a new Stripe PaymentIntent are created each time the same idempotency_key is reused. Multiple database rows exist with idempotency_key = "order-123".

## BUG-02

**Summary:** Capture amount greater than the authorized amount is not rejected before calling Stripe

**Severity:** High — The backend fails to enforce a core payment invariant and allows an invalid financial operation to reach the PSP.

**Steps to Reproduce:**

1. Create a payment with amount = 5000 and capture_method = manual.

2. Verify that the payment status is requires_capture.

3. Send POST /api/payments/{id}/capture with body { "amount": 6000 }.

**Expected Result:** The API should reject the request with HTTP 400 because the requested capture amount exceeds the authorized amount. The invalid capture request should not be sent to Stripe.

**Actual Result:** The backend accepts the overcapture request and calls Stripe. Stripe rejects it with amount_too_large.

## BUG-03

**Summary:** Stripe capture failure is treated locally as a successful capture

**Severity:** Critical — The merchant system can report funds as captured when Stripe did not capture them, causing direct financial-state inconsistency and potentially incorrect fulfilment or accounting.

**Steps to Reproduce:**

1. Create a manual-capture payment for amount = 5000.

2. Trigger a capture operation that Stripe will reject, for example capture amount = 6000.

3. Compare the API response and local database state with the Stripe Dashboard and application logs.

**Expected Result:** If Stripe rejects the capture, the API should return an error and the local payment should remain uncaptured. No successful captured amount should be stored.

**Actual Result:** Stripe rejects the capture, but the API and local database report status = succeeded and captured_amount = 6000, while Stripe still shows the original payment as uncaptured. The same behavior was also reproduced after a manual PaymentIntent was canceled in Stripe: a later capture was rejected by Stripe but returned locally as succeeded with captured_amount = 5000.

## BUG-04

**Summary:** Partial refund immediately marks the payment as fully refunded

**Severity:** High — The incorrect status prevents valid remaining refunds and misrepresents the financial state of the payment.

**Steps to Reproduce:**

1. Create a succeeded payment for amount = 5000.

2. Send a partial refund for amount = 1000.

3. Check the payment status.

4. Attempt another refund for the remaining balance.

**Expected Result:** After a partial refund, the payment should remain eligible for additional refunds. The status should become refunded only when the cumulative successful refund amount equals the full paid amount.

**Actual Result:** After refunding only 1000 of 5000, the payment is immediately marked refunded. A subsequent refund is rejected with invalid_state.

## BUG-05

**Summary:** Webhook signature verification is missing, allowing forged Stripe events to modify payment state

**Severity:** Critical — An unauthenticated sender can impersonate Stripe and change financial states of real payments, creating a direct security and data-integrity risk.

**Steps to Reproduce:**

1. Send POST /api/webhooks with a Stripe-like event payload but without the Stripe-Signature header.

2. Verify that the endpoint accepts the event.

3. Send a forged payment_intent.succeeded event referencing a real failed payment.

4. Send a forged charge.refunded event referencing a real succeeded payment.

5. Check the affected payment statuses in the database.

**Expected Result:** Webhook requests without a valid Stripe-Signature should be rejected and must not be processed as trusted Stripe events.

**Actual Result:** Unsigned events are accepted with HTTP 200 and stored. A forged payment_intent.succeeded event changed a real payment from failed to succeeded, and a forged charge.refunded event changed a real payment from succeeded to refunded.

## BUG-06

**Summary:** Duplicate Stripe webhook event is processed and stored multiple times

**Severity:** High — Stripe may legitimately retry webhook delivery; processing the same event repeatedly can duplicate business side effects and corrupt downstream state.

**Steps to Reproduce:**

1. Send POST /api/webhooks with an event containing a fixed event ID, for example evt_test_no_signature.

2. Send the exact same event again with the same event ID.

3. Query the webhook_events table for that stripe_event_id.

**Expected Result:** The duplicate event should be recognized as already processed and handled idempotently. The same Stripe event should not be processed as a new event again.

**Actual Result:** The same stripe_event_id is stored again as a separate database row with a different local ID and processed_at timestamp.

## BUG-07

**Summary:** Failed Stripe refund is stored locally as successful and marks the payment as refunded

**Severity:** Critical — The system can tell the merchant or customer that money was refunded when Stripe never processed the refund, causing severe financial reconciliation errors.

**Steps to Reproduce:**

1. Create a succeeded payment with a refundable balance lower than the refund amount to be requested.

2. Send POST /api/payments/{id}/refund with an amount greater than the refundable balance.

3. Inspect the API response, refunds table, payment table and application logs.

**Expected Result:** If Stripe rejects the refund, the API should return an error, no successful refund record should be created, and the payment status should not change to refunded.

**Actual Result:** Stripe rejects the refund, but the service creates a local refund with status = succeeded and stripe_refund_id = null. The payment can also be marked refunded even though no refund was completed in Stripe.

## BUG-08

**Summary:** amount: null is treated as an omitted amount and triggers a full capture or full refund

**Severity:** High — An explicitly invalid value can trigger a real full financial operation instead of being rejected, which may capture or return the full amount unintentionally.

**Steps to Reproduce:**

1. Create a payment in requires_capture status and send POST /api/payments/{id}/capture with body { "amount": null }.

2. Observe the capture result.

3. Create or use a succeeded payment and send POST /api/payments/{id}/refund with body { "amount": null }.

4. Observe the refund result.

**Expected Result:** If amount is explicitly provided as null, the API should return HTTP 400 validation_error because amount must be a positive integer.

**Actual Result:** For capture, amount: null is treated as if the field were omitted and a full capture is performed. For refund, amount: null is also treated as omitted and a full refund is performed.

## BUG-09

**Summary:** client_secret is exposed by payment read endpoints

**Severity:** High — client_secret is sensitive payment data intended for the client-side payment flow; exposing it through general read/list endpoints unnecessarily broadens access and violates the documented API contract.

**Steps to Reproduce:**

1. Create a payment and note its payment ID.

2. Send GET /api/payments/{id}.

3. Send GET /api/payments?limit=5.

4. Inspect the returned payment objects.

**Expected Result:** client_secret should be returned only in the response to POST /api/payments and should not be present in GET /api/payments/{id} or GET /api/payments responses.

**Actual Result:** client_secret is returned by both GET /api/payments/{id} and GET /api/payments.

## BUG-10

**Summary:** Negative limit is normalized to 1 instead of the documented default 20

**Severity:** Low — The defect does not corrupt financial data, but the API does not follow its documented pagination contract and may return an unexpectedly small result set.

**Steps to Reproduce:**

1. Send GET /api/payments?limit=-5.

2. Check the limit field in the response.

**Expected Result:** Because -5 is an invalid limit value, the API should use the documented default and return limit = 20.

**Actual Result:** The API normalizes the negative value to limit = 1.
