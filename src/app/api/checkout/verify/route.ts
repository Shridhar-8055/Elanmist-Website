import { after } from "next/server";
import { verifyPaymentSchema } from "@/lib/checkout-schema";
import { completePaidOrder, ownReferralCode } from "@/lib/paid-order";
import { siteUrl } from "@/lib/site";
import { recordOrder } from "@/lib/sheets";
import {
  fetchOrder,
  fetchPayment,
  RazorpayApiError,
  RazorpayConfigError,
  verifyPaymentSignature,
} from "@/lib/razorpay";

// Called by the browser after Razorpay Checkout reports success. We never take
// the browser's word for it: the signature must match, and the payment is
// re-fetched from Razorpay to confirm its status and amount.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ verified: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = verifyPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ verified: false, error: "Invalid payment response." }, { status: 400 });
  }
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = parsed.data;

  try {
    if (!verifyPaymentSignature(orderId, paymentId, signature)) {
      console.warn("[checkout/verify] signature mismatch", { orderId, paymentId });
      return Response.json({ verified: false, error: "Payment could not be verified." }, { status: 400 });
    }

    const [payment, order] = await Promise.all([fetchPayment(paymentId), fetchOrder(orderId)]);

    const statusOk = payment.status === "captured" || payment.status === "authorized";
    if (payment.order_id !== orderId || !statusOk || payment.amount !== order.amount) {
      console.warn("[checkout/verify] payment mismatch", {
        orderId,
        paymentId,
        paymentOrder: payment.order_id,
        status: payment.status,
        paid: payment.amount,
        expected: order.amount,
      });
      return Response.json({ verified: false, error: "Payment could not be confirmed." }, { status: 400 });
    }

    // Created now so the success page can show it; null for referral orders or if unavailable.
    // Capped at 4 s so a slow database never holds up the confirmation; the webhook issues it later.
    const referralCode = await Promise.race([
      ownReferralCode(order),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4_000)),
    ]);
    const site = siteUrl(request);

    after(async () => {
      await recordOrder(order.receipt, {
        status: "Paid",
        razorpayOrderId: orderId,
        paymentId,
        method: payment.method,
      });
      // Also runs from the order.paid webhook; every step is safe to repeat.
      await completePaidOrder(order, site, referralCode);
    });

    console.info("[checkout/verify] payment verified", {
      orderId,
      paymentId,
      receipt: order.receipt,
      amount: payment.amount,
      status: payment.status,
      method: payment.method,
    });

    return Response.json({
      verified: true,
      orderId,
      paymentId,
      receipt: order.receipt,
      amount: payment.amount / 100,
      status: payment.status,
      referralCode,
    });
  } catch (error) {
    if (error instanceof RazorpayConfigError) {
      console.error("[checkout/verify]", error.message);
      return Response.json({ verified: false, error: "Payments are not set up yet." }, { status: 503 });
    }
    if (error instanceof RazorpayApiError) {
      console.error("[checkout/verify]", error.status, error.message);
      return Response.json(
        { verified: false, error: "We couldn't confirm your payment yet. If money was deducted, it is safe — contact support." },
        { status: 502 },
      );
    }
    console.error("[checkout/verify] unexpected", error);
    return Response.json({ verified: false, error: "Something went wrong." }, { status: 500 });
  }
}
