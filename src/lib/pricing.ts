import { FREE_SHIPPING_THRESHOLD, getProduct, SHIPPING_FEE } from "./products";

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
  shipping: number;
  total: number;
};

/**
 * Prices a cart from the catalogue. The server calls this to decide what to
 * charge, so prices sent by the browser are never trusted. Throws on unknown
 * products or invalid quantities.
 */
export function priceCart(input: CartLineInput[]): OrderTotals {
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
  const shipping = shippingFor(subtotal);
  return { lines, subtotal, shipping, total: subtotal + shipping };
}

export function shippingFor(subtotal: number) {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export class PricingError extends Error {}
