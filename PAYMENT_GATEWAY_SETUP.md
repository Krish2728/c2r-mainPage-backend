# Payment Gateway Setup for Donations

This guide outlines what needs to be done to connect a real payment gateway (Stripe or Razorpay) to the Connect2Roots donation flow.

---

## Current State

- **Frontend:** Donate page collects amount (tier or custom), donor name, and email, then calls `POST /api/donations`.
- **Backend:** `donationController.js` inserts a row in `donations` with status `pending` and returns a **placeholder** `checkoutUrl` that redirects directly to the success page (no real payment).
- **Success/Cancel:** `DonationSuccessPage` and `DonationCancelPage` exist; success URL is used after payment.

---

## What Needs to Be Done

### Option A: Stripe (global, card payments)

1. **Stripe account**
   - Sign up at [stripe.com](https://stripe.com) and get **Secret key** and **Publishable key** from the Dashboard.

2. **Backend**
   - Install: `npm install stripe`
   - In `donationController.js` (or a new `stripeService.js`):
     - After inserting the donation row, create a [Stripe Checkout Session](https://stripe.com/docs/api/checkout/sessions/create) with:
       - `mode: 'payment'`
       - `amount_total`: use `amountPaise` (already in smallest currency unit; Stripe expects cents, so if you use INR and store paise, pass paise)
       - `currency: 'inr'` (or your currency)
       - `success_url`: e.g. `${FRONTEND_URL}/donation-success?donationId=${row.id}&session_id={CHECKOUT_SESSION_ID}`
       - `cancel_url`: e.g. `${FRONTEND_URL}/donation-cancel?donationId=${row.id}`
       - `customer_email`: donor email
       - `metadata`: e.g. `{ donationId: row.id }` so the webhook can match the session to your donation
     - Return `session.url` as `checkoutUrl` in the API response (instead of the placeholder success URL).

3. **Webhook**
   - In Stripe Dashboard → Developers → Webhooks, add an endpoint: `https://your-api.com/api/donations/webhook` (or `/api/webhooks/stripe`).
   - Subscribe to `checkout.session.completed`.
   - In your backend, add a route (e.g. `POST /api/donations/webhook`) that:
     - Verifies the signature using `STRIPE_WEBHOOK_SECRET`.
     - On `checkout.session.completed`, reads `metadata.donationId`, then calls your existing `completeDonation` logic (update donation status, set `payment_session_id`, `payment_provider: 'stripe'`).

4. **Environment variables**
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `FRONTEND_URL` (already used for success/cancel URLs)

5. **Frontend**
   - No code change needed: it already redirects to `result.checkoutUrl`. Optionally parse `session_id` from the success URL and show it on the success page.

---

### Option B: Razorpay (India-focused, UPI/cards/netbanking)

1. **Razorpay account**
   - Sign up at [razorpay.com](https://razorpay.com), get **Key ID** and **Key Secret** from Dashboard.

2. **Backend**
   - Install: `npm install razorpay`
   - After inserting the donation row, create an [Razorpay Order](https://razorpay.com/docs/api/orders/create/):
     - `amount`: in paise
     - `currency`: 'INR'
     - `receipt`: e.g. `donation_${row.id}`
   - Store `order.id` (or payment link) and return a **payment link** or use Checkout on frontend.
   - Razorpay can return a short URL for “payment page”; use that as `checkoutUrl`, or integrate [Razorpay Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/) on the frontend with `order_id` and redirect to success/cancel.

3. **Webhook**
   - In Razorpay Dashboard → Webhooks, add `https://your-api.com/api/donations/webhook` and subscribe to `payment.captured`.
   - Verify signature, find donation by `receipt` or payment metadata, then call `completeDonation`.

4. **Environment variables**
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`
   - `FRONTEND_URL`

---

## Backend Checklist (any gateway)

- [ ] Add gateway SDK (Stripe or Razorpay).
- [ ] In `createDonation`: create payment session/order and set `checkoutUrl` to the real payment page URL.
- [ ] Add webhook route; verify signature; on success event call `completeDonation(id, payment_session_id, payment_provider)`.
- [ ] Add env vars and document in README or `.env.example`.
- [ ] Test with gateway test keys and test success/cancel flows.

---

## Frontend (already in place)

- Donate page: amount selection, name, email, “Proceed to Payment” → calls API and redirects to `checkoutUrl`.
- Success page: reads `donationId` (and optionally `session_id`) from URL; can call an API to fetch donation details if needed.
- Cancel page: handles back-from-gateway cancel.

Once the backend returns a real `checkoutUrl`, the current frontend will redirect users to the gateway and then to success/cancel without further changes.
