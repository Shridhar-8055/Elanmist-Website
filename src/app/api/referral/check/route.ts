import { z } from "zod";
import { createOrderSchema, customerSchema } from "@/lib/checkout-schema";
import { checkCoupon, COUPON_CODE, couponMessage } from "@/lib/coupons";
import { offerLabel, priceCart, PricingError, type Offer } from "@/lib/pricing";
import { checkReferral, normaliseReferralCode, REFERRAL_CODE, referralMessages, referralsEnabled } from "@/lib/referrals";
import { clientIp } from "@/lib/turnstile";

// Checks a referral code or admin coupon for the checkout "Apply" button. The order
// route checks again (and holds the code) when the shopper pays, so this is a preview.

const schema = z.object({
  code: z.string().trim().min(1).max(20),
  email: customerSchema.shape.email,
  phone: customerSchema.shape.phone,
  address1: z.string().trim().max(120).optional(),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/).optional().or(z.literal("")),
  items: createOrderSchema.shape.items,
});

// Simple per-IP limit so codes can't be guessed by brute force: 10 checks per 10 minutes.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_CHECKS = 10;
const attempts = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (attempts.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  attempts.set(ip, recent);
  if (attempts.size > 5000) attempts.clear(); // bound memory
  return recent.length > MAX_CHECKS;
}

export async function POST(request: Request) {
  if (!referralsEnabled()) {
    return Response.json({ error: "Codes aren't available right now." }, { status: 503 });
  }
  if (rateLimited(clientIp(request) ?? "unknown")) {
    return Response.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    const error =
      field === "email" || field === "phone"
        ? "Enter your email and mobile number above first, so we can check the code is valid for you."
        : referralMessages.invalid;
    return Response.json({ error }, { status: 422 });
  }

  const code = normaliseReferralCode(parsed.data.code);
  const person = {
    email: parsed.data.email,
    phone: parsed.data.phone,
    address1: parsed.data.address1 || undefined,
    pincode: parsed.data.pincode || undefined,
  };

  try {
    let offer: Offer;
    let kind: "referral" | "coupon";
    if (REFERRAL_CODE.test(code)) {
      const result = await checkReferral(code, person);
      if (result !== "ok") return Response.json({ error: referralMessages[result] }, { status: 422 });
      offer = { kind: "free_product", value: 0 };
      kind = "referral";
    } else if (COUPON_CODE.test(code)) {
      const subtotal = priceCart(parsed.data.items).subtotal;
      const reply = await checkCoupon(code, person, subtotal);
      if (reply.result !== "ok" || !reply.kind) return Response.json({ error: couponMessage(reply) }, { status: 422 });
      offer = { kind: reply.kind, value: reply.value ?? 0 };
      kind = "coupon";
    } else {
      return Response.json({ error: referralMessages.invalid }, { status: 422 });
    }
    return Response.json({ valid: true, code, kind, offer, label: offerLabel(offer) });
  } catch (error) {
    if (error instanceof PricingError) return Response.json({ error: error.message }, { status: 422 });
    console.error("[referral/check]", String(error));
    return Response.json({ error: "We couldn't check the code right now. Please try again." }, { status: 503 });
  }
}
