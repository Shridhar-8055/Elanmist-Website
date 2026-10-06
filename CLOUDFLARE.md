# Moving elanmist.com to this site (Cloudflare + Vercel)

**Current setup (checked 2026-10-06):**
- **DNS:** elanmist.com already uses Cloudflare nameservers (`chan` / `garrett.ns.cloudflare.com`).
- **Website:** the domain points at the old WordPress site, proxied through Cloudflare.
- **Email:** support@elanmist.com runs on **Hostinger** (MX `mx1/mx2.hostinger.com`, SPF `include:_spf.mail.hostinger.com`). **These email records must not be changed.**

The switch only changes two DNS records: the website (`@`) and `www`.

## A. Before the switch

1. **Back up WordPress.** In Hostinger hPanel → Backups, download the files and database, and export WooCommerce orders if needed.
2. **Check Vercel.** In Vercel → elanmist-website, the latest deployment is **Ready** and https://elanmist-website.vercel.app works.
3. **Set up Turnstile (bot protection on checkout):**
   1. In the Cloudflare dashboard → **Turnstile** → **Add widget**.
   2. **Name:** Elanmist checkout. **Hostnames:** `elanmist.com`, `www.elanmist.com`, `elanmist-website.vercel.app`. **Mode:** Managed.
   3. Copy the **Site Key** and **Secret Key**.
   4. In Vercel → Settings → Environment Variables (Production), add:
      - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = Site Key
      - `TURNSTILE_SECRET_KEY` = Secret Key (Sensitive)
   5. **Redeploy.** Checkout now shows a small "Success!" check above the Pay button.

## B. The switch (about 15 minutes)

1. **Add the domains in Vercel.** In Vercel → elanmist-website → **Settings → Domains**, add `elanmist.com` and `www.elanmist.com`.
   - Choose to **redirect www → elanmist.com** when asked.
   - Vercel then shows the exact DNS records it needs: an **A** record for `@` and a **CNAME** for `www`. Keep that page open.
2. **Change the DNS in Cloudflare.** In the Cloudflare dashboard → elanmist.com → **DNS → Records**:
   - Edit the **A** record named `elanmist.com` (`@`): set the IPv4 address to the value Vercel shows, and set **Proxy status** to **DNS only** (grey cloud).
   - If there are **AAAA** records for `@`, delete them. They point to the old host.
   - Edit the `www` record: set it to **CNAME** → the target Vercel shows, with **Proxy status** set to **DNS only** (grey cloud).
   - Leave **MX**, **TXT/SPF** and any mail-related CNAMEs exactly as they are.
3. **Check SSL/TLS.** In Cloudflare → **SSL/TLS → Overview**, the mode should be **Full (strict)**. This only matters if you ever turn the orange cloud back on.
4. **Wait for Vercel.** Back on Vercel → Domains, wait for both domains to show **Valid Configuration**. Vercel issues the SSL certificate automatically, usually within minutes.

Vercel recommends **DNS only** (grey cloud) for domains pointing at Vercel. Vercel already provides the CDN, SSL and DDoS protection, and proxying through Cloudflare as well can break certificate renewal and caching.

## C. After the switch

1. **Razorpay webhook.** In Dashboard → Webhooks → Edit, change the URL to `https://elanmist.com/api/webhooks/razorpay`. Keep the same secret. Do this in both Test and Live mode if you have both.
2. **Test, in order:**
   - [ ] https://elanmist.com and https://www.elanmist.com open the new site (www → elanmist.com)
   - [ ] Old links redirect, e.g. `/product/hybrid-sunscreen/`, `/our-Vision/`, `/privacy-policy/`
   - [ ] A test checkout writes a row in the Google Sheet, and a Netbanking **Success** payment marks it **Paid**
   - [ ] **Email still works:** send a message to support@elanmist.com and reply from it
3. **Google Search Console** (if used): submit `https://elanmist.com/sitemap.xml` once a sitemap is added.

## Rollback (if anything goes wrong)

In Cloudflare DNS, set the `@` A record and `www` back to their old values with the orange cloud on, as noted in step B.2. The old WordPress site is back within a minute or two.

**Before editing, take a screenshot of the DNS records page** so you have the old values.
