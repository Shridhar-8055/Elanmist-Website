# Razorpay payments

Prepaid checkout through [Razorpay Standard Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/): UPI, cards, netbanking and wallets. Cash on delivery isn't offered online yet (see Phase 2).

## How a payment flows

```
Cart ─► /checkout (form + order summary)
          │  POST /api/checkout/order   { customer, items: [{slug, qty}] }
          ▼
     Server prices the cart from the catalogue (src/lib/pricing.ts),
     creates a Razorpay order for that amount, returns order_id + key_id
          │
          ▼
     Razorpay Checkout modal opens (checkout.js, loaded only on this page)
          │  shopper pays
          ▼
     POST /api/checkout/verify   { razorpay_order_id, razorpay_payment_id, razorpay_signature }
     Server checks the HMAC signature, re-fetches the payment and order from
     Razorpay, and confirms status (captured/authorized), order id and amount
          │
          ▼
     Cart cleared → /order/success

Separately: Razorpay ──► POST /api/webhooks/razorpay  (signature-checked)
            payment.captured / order.paid / payment.failed / refund.processed
```

## Security measures

- **Server-side pricing.** The browser sends only product slugs and quantities. Prices, the delivery fee (`SHIPPING_FEE`, currently ₹70 under ₹500) and totals are computed on the server from `src/lib/products.ts`.
- **Signature verification.** Both the checkout response and webhooks are verified with HMAC-SHA256, compared in constant time.
- **Double-check with Razorpay.** After the signature passes, the payment and order are fetched from the Razorpay API, and the status, order id and amount must all match.
- **Secrets stay server-side.** `src/lib/razorpay.ts` is `server-only`. Only the public key id reaches the browser. Card data goes straight to Razorpay.
- **Validated input.** Zod schemas cover name, email, Indian mobile (6–9 prefix, 10 digits), 6-digit pincode, state list, and a quantity cap of 10 per product.

## Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (see `.env.example`):

| Variable | Where to get it |
|---|---|
| `RAZORPAY_KEY_ID` | Razorpay Dashboard → Account & Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | Shown once when you generate the key. Store it safely. |
| `RAZORPAY_WEBHOOK_SECRET` | A long random string you choose when adding the webhook |
| `GOOGLE_SHEETS_WEBHOOK_URL` | Apps Script web-app URL (see the Google Sheets guide) |
| `GOOGLE_SHEETS_WEBHOOK_SECRET` | Same value as `SHARED_SECRET` in the Apps Script |

Use `rzp_test_…` keys in **Preview** and `rzp_live_…` keys in **Production**. Redeploy after changing variables.

## Webhook setup

Razorpay Dashboard → Account & Settings → Webhooks → **Add new webhook**:

- **URL:** `https://<your-domain>/api/webhooks/razorpay`
- **Secret:** the same value as `RAZORPAY_WEBHOOK_SECRET`
- **Events:** `payment.captured`, `payment.failed`, `order.paid`, `refund.processed`

Add it separately in Test mode and in Live mode, because each mode has its own webhooks.

## Testing (Test mode)

1. Add test keys to Vercel (Preview or Production) and redeploy.
2. Add a product to the cart → Check out → fill in the form → Pay.
3. Use Razorpay test credentials: UPI `success@razorpay` (or `failure@razorpay`), or a [test card](https://razorpay.com/docs/payments/payments/test-card-details/).
4. Confirm that:
   - the success page shows the order number,
   - the payment appears in Dashboard → Transactions with the customer and address in **Notes**,
   - Vercel → Logs shows `[checkout/verify] payment verified` and `[webhook/razorpay] paid`.
5. Also test: closing the modal (cart is kept, friendly message) and a failed payment.

## Go-live checklist

- [ ] Razorpay account KYC approved and website URL whitelisted
- [ ] Payment capture set to **Automatic** (Dashboard → Account & Settings → Payment capture)
- [ ] Live keys added to Vercel **Production** env and redeployed
- [ ] Live-mode webhook added with the production domain
- [ ] One real low-value order placed and refunded from the dashboard
- [ ] Policy links (shipping/returns, privacy, terms) are reachable from checkout and the footer (Razorpay requires these)

## Where orders live today

- **Google Sheet:** every checkout is written as a row the moment the shopper presses Pay. The row moves through *Awaiting payment → Paid / Payment failed*. See [integrations/google-sheets/README.md](integrations/google-sheets/README.md).
- **Razorpay:** each order also carries the customer's name, email, phone, address, items and totals in its **notes** (Dashboard → Orders/Transactions).

## Phase 2 (recommended next)

- **Order database** (e.g. Vercel Postgres/Neon): store orders and mark them paid from the webhook, de-duplicating on `x-razorpay-event-id`.
- **Notifications**: order confirmation email to the customer and a "new order" alert to support@elanmist.com (e.g. Resend).
- **Cash on delivery**, once orders are stored.
- **Shipping integration** (e.g. Shiprocket) for tracking numbers.
- **Rate limiting** on `/api/checkout/order`.
