import { after } from "next/server";
import { RazorpayConfigError, verifyWebhookSignature } from "@/lib/razorpay";
import { recordOrder } from "@/lib/sheets";

// Razorpay webhook endpoint. Configure in Dashboard → Settings → Webhooks:
//   URL:    https://<your-domain>/api/webhooks/razorpay
//   Secret: same value as RAZORPAY_WEBHOOK_SECRET
//   Events: payment.captured, payment.failed, order.paid, refund.processed
//
// Webhooks are the source of truth: they arrive even if the shopper closes the
// tab before the browser-side verification finishes.

type WebhookEvent = {
  event: string;
  created_at: number;
  payload: {
    payment?: { entity: { id: string; order_id: string; amount: number; status: string; method: string; email?: string; contact?: string; error_description?: string | null; notes?: Record<string, string> } };
    order?: { entity: { id: string; receipt: string; amount: number; status: string; notes?: Record<string, string> } };
    refund?: { entity: { id: string; payment_id: string; amount: number; status: string } };
  };
};

export async function POST(request: Request) {
  // The signature is computed over the exact raw body, so read it as text first.
  const raw = await request.text();

  try {
    if (!verifyWebhookSignature(raw, request.headers.get("x-razorpay-signature"))) {
      console.warn("[webhook/razorpay] invalid signature");
      return new Response("Invalid signature", { status: 400 });
    }
  } catch (error) {
    if (error instanceof RazorpayConfigError) {
      console.error("[webhook/razorpay]", error.message);
      return new Response("Webhook not configured", { status: 500 });
    }
    throw error;
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Razorpay retries deliveries, so handlers must be idempotent. Use this id to
  // de-duplicate once an order database is in place.
  const eventId = request.headers.get("x-razorpay-event-id");
  const payment = event.payload.payment?.entity;
  const order = event.payload.order?.entity;
  // Our order number travels as `receipt` on the order and in the payment's notes.
  const orderNo = order?.receipt ?? payment?.notes?.receipt;

  switch (event.event) {
    case "payment.captured":
    case "order.paid":
      // TODO(phase 2): notify the team (e.g. email support@elanmist.com) so it can be packed and shipped.
      if (orderNo) {
        after(() =>
          recordOrder(orderNo, {
            status: "Paid",
            razorpayOrderId: payment?.order_id ?? order?.id,
            paymentId: payment?.id,
            method: payment?.method,
          }),
        );
      }
      console.info("[webhook/razorpay] paid", {
        eventId,
        event: event.event,
        orderId: payment?.order_id ?? order?.id,
        paymentId: payment?.id,
        receipt: order?.receipt,
        amount: (payment?.amount ?? order?.amount ?? 0) / 100,
        method: payment?.method,
      });
      break;
    case "payment.failed":
      if (orderNo) {
        after(() =>
          recordOrder(orderNo, {
            status: "Payment failed",
            paymentId: payment?.id,
            method: payment?.method,
            notes: payment?.error_description ?? undefined,
          }),
        );
      }
      console.info("[webhook/razorpay] failed", {
        eventId,
        orderId: payment?.order_id,
        paymentId: payment?.id,
        reason: payment?.error_description,
      });
      break;
    case "refund.processed":
      console.info("[webhook/razorpay] refund", { eventId, refund: event.payload.refund?.entity });
      break;
    default:
      console.info("[webhook/razorpay] ignored", { eventId, event: event.event });
  }

  // Always acknowledge quickly so Razorpay doesn't retry a handled event.
  return new Response("OK", { status: 200 });
}
