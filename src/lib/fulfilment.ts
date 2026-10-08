import "server-only";
import { recordOrder } from "./sheets";
import { createShipment, ShiprocketConfigError, shiprocketConfigured } from "./shiprocket";

/**
 * Sends a paid order to Shiprocket, using the details saved in the Razorpay
 * order's notes at checkout. Safe to call more than once for the same order.
 * Never throws: problems are logged and noted in the orders sheet.
 */
export async function fulfilPaidOrder(order: { receipt: string; created_at?: number; notes?: Record<string, string> }) {
  if (!shiprocketConfigured()) {
    console.warn("[fulfilment] Shiprocket not configured — skipping shipment", { orderNo: order.receipt });
    return;
  }
  const n = order.notes ?? {};
  const items = (n.cart ?? "")
    .split(",")
    .map((part) => part.split(":"))
    .filter(([slug, qty]) => slug && Number(qty) > 0)
    .map(([slug, qty]) => ({ slug, qty: Number(qty) }));

  if (!items.length || !n.pincode || !n.customer_phone) {
    console.error("[fulfilment] order is missing cart or address notes", { orderNo: order.receipt });
    await recordOrder(order.receipt, { shipmentStatus: "Create manually in Shiprocket", notes: "Missing cart/address on order" });
    return;
  }

  try {
    const result = await createShipment({
      orderNo: order.receipt,
      orderDate: order.created_at ? new Date(order.created_at * 1000) : new Date(),
      customer: {
        name: n.customer_name,
        email: n.customer_email,
        phone: n.customer_phone,
        address1: n.address_line1,
        address2: n.address_line2,
        city: n.city,
        state: n.state,
        pincode: n.pincode,
      },
      items,
      shipping: Number(n.shipping ?? 0),
      subtotal: Number(n.subtotal ?? 0),
    });
    console.info("[fulfilment] shipment ready in Shiprocket", { orderNo: order.receipt, ...result });
    await recordOrder(order.receipt, {
      shipmentStatus: "Ready to ship",
      shiprocketOrderId: String(result.shiprocketOrderId),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[fulfilment] could not create Shiprocket order", { orderNo: order.receipt, message });
    await recordOrder(order.receipt, {
      shipmentStatus: error instanceof ShiprocketConfigError ? "Setup incomplete" : "Create manually in Shiprocket",
      notes: message.slice(0, 200),
    });
  }
}
