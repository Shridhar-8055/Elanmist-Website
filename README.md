# Elanmist Website

Redesign of [elanmist.com](https://elanmist.com) — premium skincare powered by nature and science. Built with Next.js 16 (App Router), React 19 and Tailwind CSS 4.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

## Pages

| Route | Page |
|---|---|
| `/` | Home: hero, product panels, philosophy, key ingredients, skin-type matcher |
| `/shop` | All products |
| `/products/[slug]` | Product page: buy box, ingredients, how to use, FAQ, reviews |
| `/skin-quiz` | 3-question quiz that recommends a product |
| `/our-vision` | Brand story |
| `/contact` | Customer care, callback form, FAQs |
| `/policies/[slug]` | Shipping & returns, privacy, terms |

## Where things live

- `src/lib/products.ts` — product catalogue, prices, benefits and shipping info. Lines marked `CONFIRM` need client sign-off.
- `src/lib/imageAlt.ts` — alt text for every image.
- `src/lib/cart.tsx` — cart state (saved in the browser's localStorage).
- `public/images/shoot/` — product photography, compressed to WebP.

## Not yet connected

Checkout/payments, newsletter and form submissions, order tracking, and the Privacy / Terms policy text.
