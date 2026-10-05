# Checkout details → Google Sheets

Every time a shopper presses **Pay** on the checkout page, their details are written to a Google Sheet. That row is then updated as the payment goes through.

| Status | When |
|---|---|
| `Awaiting payment` | Shopper submitted the checkout form and the Razorpay window opened |
| `Payment setup failed` | Details captured, but the payment couldn't start (e.g. a Razorpay outage) |
| `Paid` | Payment verified on the site or confirmed by the Razorpay webhook |
| `Payment failed` | Razorpay reported a failed attempt (the shopper may retry and still pay) |

Rows still showing `Awaiting payment` after a while are **abandoned checkouts**. These are useful leads to follow up. A `Paid` row is never downgraded by a late or retried event.

**Columns:** Created, Updated, Order No, Status, Name, Email, Phone, Address line 1, Address line 2, City, State, Pincode, Items, Subtotal, Delivery, Total, Razorpay Order ID, Payment ID, Payment method, Notes.

## One-time setup (about 5 minutes)

1. **Create the sheet.** Make a new Google Sheet, e.g. "Elanmist Orders". The `Orders` tab and its headers are created automatically on the first order.
2. **Add the script.** Go to **Extensions → Apps Script**, delete the sample code, paste in all of [`Code.gs`](./Code.gs) and save.
3. **Set the secret.** Go to **Project Settings** (gear icon) → **Script properties** → **Add script property**:
   - Property: `SHARED_SECRET`
   - Value: a long random string. Keep it; you'll need it in step 5.
4. **Deploy.** Click **Deploy → New deployment**, pick type **Web app**, set *Execute as* to **Me** and *Who has access* to **Anyone**, then **Deploy**. Approve the permission prompt and copy the **Web app URL** (it ends in `/exec`).
   - "Anyone" only lets the site *send* data. The secret is still required, and nobody can read the sheet through this URL.
5. **Add the Vercel variables.** In **Vercel → Project → Settings → Environment Variables**, add:
   - `GOOGLE_SHEETS_WEBHOOK_URL` = the `/exec` URL
   - `GOOGLE_SHEETS_WEBHOOK_SECRET` = the same value as `SHARED_SECRET`
   
   Then **redeploy** (Deployments → ⋯ → Redeploy).
6. **Test.** Do a checkout. A row should appear within a few seconds.

## Updating the script later

After editing `Code.gs`, go to **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. This keeps the same URL, so Vercel needs no changes.

## Notes

- Sheet writes run *after* the shopper's response is sent, and errors are only logged (`[sheets]` in Vercel logs). A Sheets outage can never block a payment.
- Values starting with `=`, `+`, `-` or `@` are escaped, so text typed into the form can't run as a spreadsheet formula.
- The sheet holds customer personal data. Share it only with people who fulfil orders.
