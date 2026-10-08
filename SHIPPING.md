# Delivery tracking with Shiprocket

## How it works

```
Checkout ── pincode typed ──► /api/shipping/check ──► Shiprocket serviceability
                                 "✓ Delivers here — expected by Tue, 14 Oct"
                                 (non-serviceable pincodes are blocked before payment)

Razorpay order.paid webhook ──► order created in Shiprocket (Prepaid, address + items
                                from the checkout notes) ──► Sheet: Shipment status = "Ready to ship"

You, in the Shiprocket panel: pick courier → generate AWB → schedule pickup → print label

Shiprocket tracking webhook ──► /api/webhooks/delivery-updates ──► Sheet updates:
                                Shipment status, Courier, AWB, Tracking link

Customer ──► /track (order number + mobile) ──► live status + timeline
```

## Setup

### 1. Create an API user in Shiprocket
1. Go to Shiprocket → **Settings → API → Configure → Create an API User**.
2. Use an email that is **different from your Shiprocket login**, e.g. `api@elanmist.com`.
3. Set a password. The API user's login is these two values.

### 2. Check the pickup address
- Go to Shiprocket → **Settings → Pickup Addresses**.
- Note the **Pickup Location** nickname exactly as written (e.g. `Primary`, `Hubballi`), and its **pincode**.

### 3. Add the Vercel environment variables (Production, then redeploy)

| Key | Value |
|---|---|
| `SHIPROCKET_API_EMAIL` | API user email |
| `SHIPROCKET_API_PASSWORD` | API user password (Sensitive) |
| `SHIPROCKET_PICKUP_LOCATION` | Pickup Location nickname, exactly as written |
| `SHIPROCKET_PICKUP_PINCODE` | Pickup address pincode |
| `SHIPROCKET_WEBHOOK_TOKEN` | A long random string you choose (Sensitive) |

### 4. Add the tracking webhook
- Go to Shiprocket → **Settings → API → Webhooks**.
- **URL:** `https://<your-domain>/api/webhooks/delivery-updates`. Shiprocket rejects URLs containing "shiprocket", "kartrocket", "sr" or "kr", and this one avoids them.
- **Token / x-api-key:** the same value as `SHIPROCKET_WEBHOOK_TOKEN`.
- Enable the webhook and save.

### 5. Update the Google Sheet script
Paste the updated `integrations/google-sheets/Code.gs` into Apps Script, then publish it: **Deploy → Manage deployments → Edit → New version**. It adds five columns on the right: *Shipment status, Courier, AWB, Tracking link, Shiprocket Order ID*. Existing rows stay as they are.

### 6. Package sizes
In `src/lib/products.ts` → `packaging`, replace the placeholder weight and box size with the real **packed** values for each product. Couriers charge on the higher of actual and volumetric weight.

## Daily routine

1. **Check new orders.** Each paid order appears in Shiprocket → **Orders → New** (and in the Sheet as *Ready to ship*).
2. **Ship them.** Select the orders, click **Ship Now**, choose a courier, generate the AWB, schedule the pickup, and print labels.
3. **Watch the updates.** From there, statuses update automatically in the Sheet and on `/track`.
4. **Notifications.** Enable Shiprocket's branded SMS/email/WhatsApp updates under **Settings → Communication** if wanted.

## If something goes wrong

| Sheet shows | Meaning |
|---|---|
| `Setup incomplete` | A Shiprocket variable is missing in Vercel |
| `Create manually in Shiprocket` | Shiprocket rejected the order. The reason is in **Notes** and in Vercel logs (`[fulfilment]`). Create it by hand in the panel with the Sheet details. |
| No shipment columns filling in | Check the webhook URL and token in Shiprocket, and the Vercel logs (`[webhook/delivery]`) |
