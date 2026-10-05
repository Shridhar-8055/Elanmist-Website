import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { createOrderSchema, fieldErrors } from "@/lib/checkout-schema";
import { priceCart, PricingError, type OrderTotals } from "@/lib/pricing";
import { createOrder, publicKeyId, RazorpayApiError, RazorpayConfigError, toPaise } from "@/lib/razorpay";
import { recordOrder, type SheetStatus } from "@/lib/sheets";

// Creates a Razorpay order for the cart. The amount is always computed here from
// the catalogue — the browser only tells us which products and how many.
// Every checkout attempt is also written to the orders Google Sheet.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please check your details.", fields: fieldErrors(parsed.error.issues) },
      { status: 422 },
    );
  }
  const { customer, items } = parsed.data;

  let totals: OrderTotals;
  try {
    totals = priceCart(items);
  } catch (error) {
    if (error instanceof PricingError) return Response.json({ error: error.message }, { status: 422 });
    throw error;
  }

  const receipt = `EM-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
  const itemsText = totals.lines.map((l) => `${l.name} x${l.qty}`).join("; ");

  // Capture the shopper's details in the sheet whatever happens next, after the
  // response is sent so it never slows checkout down.
  const capture = (status: SheetStatus, extra: { razorpayOrderId?: string; notes?: string } = {}) =>
    after(() =>
      recordOrder(receipt, {
        status,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address1: customer.address1,
        address2: customer.address2,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        items: itemsText,
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        total: totals.total,
        ...extra,
      }),
    );

  try {
    // Razorpay notes: max 15 keys, 256 chars each. They keep the shipping details
    // with the payment in the Razorpay dashboard as a second record of the order.
    const clip = (s: string) => s.slice(0, 250);
    const order = await createOrder({
      amountPaise: toPaise(totals.total),
      receipt,
      notes: {
        customer_name: clip(customer.name),
        customer_email: clip(customer.email),
        customer_phone: customer.phone,
        address_line1: clip(customer.address1),
        address_line2: clip(customer.address2),
        city_state_pin: clip(`${customer.city}, ${customer.state} ${customer.pincode}`),
        items: clip(itemsText),
        subtotal: String(totals.subtotal),
        shipping: String(totals.shipping),
        total: String(totals.total),
      },
    });

    capture("Awaiting payment", { razorpayOrderId: order.id });

    return Response.json({
      orderId: order.id,
      receipt,
      amount: order.amount,
      currency: order.currency,
      keyId: publicKeyId(),
      totals,
    });
  } catch (error) {
    capture("Payment setup failed", { notes: error instanceof Error ? error.message.slice(0, 200) : "unknown error" });

    if (error instanceof RazorpayConfigError) {
      console.error("[checkout/order]", error.message);
      return Response.json({ error: "Payments are not set up yet. Please try again later." }, { status: 503 });
    }
    if (error instanceof RazorpayApiError) {
      console.error("[checkout/order]", error.status, error.message);
      return Response.json({ error: "We couldn't start the payment. Please try again." }, { status: 502 });
    }
    console.error("[checkout/order] unexpected", error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
