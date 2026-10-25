import "server-only";
import { confirmCoupon } from "./coupons";
import { sendOrderConfirmation } from "./email";
import { fulfilPaidOrder } from "./fulfilment";
import { confirmReferral, issueReferralCode } from "./referrals";
import { recordOrder } from "./sheets";

type PaidOrder = { receipt: string; created_at?: number; notes?: Record<string, string> };

/**
 * The buyer's own code to share, created once per paid order. Orders paid with a
 * friend's referral code don't earn one, so free orders can't chain into more free
 * orders. (Admin coupon orders do earn one — the admin controls those coupons.)
 */
export async function ownReferralCode(order: PaidOrder) {
  const n = order.notes ?? {};
  if (n.referral_code || !n.customer_email || !n.customer_phone) return null;
  return issueReferralCode(order.receipt, {
    email: n.customer_email,
    phone: n.customer_phone,
    address1: n.address_line1 ?? "",
    pincode: n.pincode ?? "",
  });
}

/**
 * Everything that happens once an order is paid. Runs from the checkout verify step
 * and again from the Razorpay webhook; every step is safe to repeat.
 */
export async function completePaidOrder(order: PaidOrder, siteUrl: string, ownCode?: string | null) {
  const n = order.notes ?? {};
  const code = ownCode === undefined ? await ownReferralCode(order) : ownCode;
  await Promise.all([
    n.referral_code ? confirmReferral(n.referral_code, order.receipt) : null,
    n.coupon_code
      ? confirmCoupon(n.coupon_code, order.receipt, { email: n.customer_email ?? "", phone: n.customer_phone ?? "" })
      : null,
    code ? recordOrder(order.receipt, { referralCode: code }) : null,
    fulfilPaidOrder(order),
    sendOrderConfirmation(order, siteUrl, code),
  ]);
}
