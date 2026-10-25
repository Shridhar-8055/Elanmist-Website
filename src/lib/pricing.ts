import { FREE_SHIPPING_THRESHOLD, getProduct, inr, SHIPPING_FEE } from "./products";

export { SHIPPING_FEE };
export const MAX_QTY_PER_ITEM = 10;

export type CartLineInput = { slug: string; qty: number };

export type PricedLine = {
  slug: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderTotals = {
  lines: PricedLine[];
  subtotal: number;
  /** Referral discount: one unit free. 0 without a referral code. */
  discount: number;
  shipping: number;
  total: number;
};

/** A discount from a referral or admin coupon. Referrals are always "free_product". */
export type Offer = { kind: "free_product" | "percent" | "flat" | "free_shipping"; value: number };

/** Short label for the order summary, e.g. "20% off" or "Free delivery". */
export function offerLabel(o: Offer) {
  switch (o.kind) {
    case "free_product":
      return "1 product free";
    case "percent":
      return `${o.value}% off`;
    case "flat":
      return `${inr(o.value)} off`;
    case "free_shipping":
      return "Free delivery";
  }
}

/** One unit free — the priciest single unit in the cart. */
export function referralDiscount(lines: { unitPrice: number }[]) {
  return lines.reduce((max, l) => Math.max(max, l.unitPrice), 0);
}

/** Discount and delivery for a cart with an offer applied. Shared by server and checkout UI. */
export function applyOffer(lines: { unitPrice: number }[], subtotal: number, offer?: Offer | null) {
  let discount = 0;
  if (offer?.kind === "free_product") discount = referralDiscount(lines);
  else if (offer?.kind === "percent") discount = Math.round((subtotal * Math.min(offer.value, 100)) / 100);
  else if (offer?.kind === "flat") discount = Math.min(offer.value, subtotal);
  // Delivery is judged on what the shopper actually pays for.
  const shipping = offer?.kind === "free_shipping" ? 0 : shippingFor(subtotal - discount);
  return { discount, shipping };
}

/**
 * Prices a cart from the catalogue. The server calls this to decide what to
 * charge, so prices sent by the browser are never trusted. Throws on unknown
 * products or invalid quantities.
 */
export function priceCart(input: CartLineInput[], opts: { offer?: Offer | null } = {}): OrderTotals {
  if (!input.length) throw new PricingError("Your cart is empty.");

  // Merge duplicate lines so the same product can't slip past the quantity cap.
  const merged = new Map<string, number>();
  for (const { slug, qty } of input) merged.set(slug, (merged.get(slug) ?? 0) + qty);

  const lines = [...merged].map(([slug, qty]) => {
    const product = getProduct(slug);
    if (!product) throw new PricingError(`Unknown product: ${slug}`);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) {
      throw new PricingError(`Quantity for ${product.name} must be between 1 and ${MAX_QTY_PER_ITEM}.`);
    }
    return { slug, name: product.name, qty, unitPrice: product.price, lineTotal: product.price * qty };
  });

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const { discount, shipping } = applyOffer(lines, subtotal, opts.offer);
  return { lines, subtotal, discount, shipping, total: subtotal - discount + shipping };
}

export function shippingFor(subtotal: number) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export class PricingError extends Error {}
