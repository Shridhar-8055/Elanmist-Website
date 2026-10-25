import "server-only";
import { inr } from "./products";
import type { Offer } from "./pricing";
import { rpc } from "./supabase-admin";

// Admin-created coupons (managed in /admin/coupons). Rules — active, dates, assigned
// customer, minimum order, total uses and uses per customer — are checked atomically
// in Postgres; see integrations/supabase/schema.sql.

/** Admin coupon codes: 4–20 letters/digits, never starting with ELAN (those are referral codes). */
export const COUPON_CODE = /^(?!ELAN)[A-Z0-9]{4,20}$/;

export type CouponResult =
  | "ok"
  | "invalid"
  | "inactive"
  | "not_started"
  | "expired"
  | "not_for_you"
  | "min_order"
  | "used_up"
  | "already_used";

type CouponReply = { result: CouponResult; kind?: Offer["kind"]; value?: number; min_order?: number; description?: string };

export function couponMessage(r: CouponReply) {
  switch (r.result) {
    case "inactive":
    case "invalid":
      return "That code isn't valid. Check it and try again.";
    case "not_started":
      return "This coupon isn't active yet.";
    case "expired":
      return "This coupon has expired.";
    case "not_for_you":
      return "This coupon is reserved for another customer. Check the mobile number and email you entered.";
    case "min_order":
      return `This coupon needs an order of at least ${inr(r.min_order ?? 0)}.`;
    case "used_up":
      return "This coupon has reached its usage limit.";
    case "already_used":
      return "You've already used this coupon.";
    default:
      return "That code isn't valid.";
  }
}

type Who = { email: string; phone: string };
const who = (w: Who) => ({ p_email: w.email.trim().toLowerCase(), p_phone: w.phone });

export function checkCoupon(code: string, person: Who, subtotal: number) {
  return rpc<CouponReply>("check_coupon", { p_code: code, ...who(person), p_subtotal: subtotal });
}

/** Holds one use of the coupon for this order while the shopper pays (30 minutes). */
export function reserveCoupon(code: string, orderNo: string, person: Who, subtotal: number) {
  return rpc<CouponReply>("reserve_coupon", { p_code: code, p_order_no: orderNo, ...who(person), p_subtotal: subtotal });
}

/** Marks the use final once the order is paid. Safe to call repeatedly. Never throws. */
export async function confirmCoupon(code: string, orderNo: string, person: Who) {
  try {
    const result = await rpc<string>("confirm_coupon", { p_code: code, p_order_no: orderNo, ...who(person) });
    if (result !== "ok") console.warn("[coupon] confirm", { code, orderNo, result });
  } catch (error) {
    console.error("[coupon] confirm failed", { code, orderNo, message: String(error) });
  }
}
