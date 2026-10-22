import "server-only";
import { randomInt } from "node:crypto";
import { rpc, supabaseConfigured } from "./supabase-admin";

// Referral codes: each paid order gets one code to share; a friend who uses it gets one
// unit free and pays delivery. All rules (one use, not your own code, one referral per
// person) are enforced atomically in Postgres — see integrations/supabase/schema.sql.

// No 0/O/1/I so codes are easy to read out and type.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const REFERRAL_CODE = /^ELAN[A-HJ-NP-Z2-9]{6}$/;

export const referralsEnabled = supabaseConfigured;

export function normaliseReferralCode(input: string) {
  return input.toUpperCase().replace(/[\s-]/g, "");
}

/** Same street + pincode → same key, however it's capitalised or punctuated. */
export function addressKey(address1: string, pincode: string) {
  return `${address1.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40)}-${pincode}`;
}

export type ReferralResult = "ok" | "invalid" | "used" | "own_code" | "already_redeemed";

export const referralMessages: Record<Exclude<ReferralResult, "ok">, string> = {
  invalid: "That referral code isn't valid. Check it and try again.",
  used: "This referral code has already been used.",
  own_code: "You can't use your own referral code — share it with a friend instead.",
  already_redeemed: "A referral code has already been used for this mobile number, email or address.",
};

type Who = { email: string; phone: string; address1?: string; pincode?: string };
const who = (w: Who) => ({
  p_email: w.email.trim().toLowerCase(),
  p_phone: w.phone,
  p_address_key: w.address1 && w.pincode ? addressKey(w.address1, w.pincode) : null,
});

/** Read-only check for the checkout "Apply" button. */
export function checkReferral(code: string, person: Who) {
  return rpc<ReferralResult>("check_referral", { p_code: code, ...who(person) });
}

/** Holds the code for this order while the shopper pays (30 minutes). */
export function reserveReferral(code: string, orderNo: string, person: Who) {
  return rpc<ReferralResult>("reserve_referral", { p_code: code, p_order_no: orderNo, ...who(person) });
}

/** Marks the code used once the order is paid. Safe to call more than once. Never throws. */
export async function confirmReferral(code: string, orderNo: string) {
  try {
    const result = await rpc<string>("confirm_referral", { p_code: code, p_order_no: orderNo });
    if (result !== "ok") console.warn("[referral] confirm", { code, orderNo, result });
    return result;
  } catch (error) {
    console.error("[referral] confirm failed", { code, orderNo, message: String(error) });
    return "error";
  }
}

/** Creates (or returns) the shareable code for a paid order. Never throws; null if unavailable. */
export async function issueReferralCode(orderNo: string, owner: Required<Who>) {
  if (!supabaseConfigured()) return null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = "ELAN" + Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
    try {
      return await rpc<string>("issue_referral_code", { p_code: candidate, p_owner_order_no: orderNo, ...who(owner) });
    } catch (error) {
      // Only a clash with an existing code (astronomically rare) is worth another try.
      const clash = /duplicate key|23505/.test(String(error));
      if (!clash || attempt === 2) {
        console.error("[referral] issue failed", { orderNo, message: String(error) });
        return null;
      }
    }
  }
  return null;
}
