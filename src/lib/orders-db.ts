import "server-only";
import type { PricedLine } from "./pricing";
import type { SheetRow, SheetStatus } from "./sheets";
import { rpc, supabaseConfigured } from "./supabase-admin";

// Mirrors every order event into the Supabase `orders` table, which powers the admin
// dashboard. The Sheet stays as the client's familiar view; both get the same events.

const STATUS: Record<SheetStatus, string> = {
  "Awaiting payment": "awaiting_payment",
  "Payment setup failed": "payment_setup_failed",
  Paid: "paid",
  "Payment failed": "payment_failed",
  Refunded: "refunded",
};

// Sheet field → database column.
const COLUMN: Partial<Record<keyof SheetRow, string>> = {
  name: "name",
  email: "email",
  phone: "phone",
  address1: "address1",
  address2: "address2",
  city: "city",
  state: "state",
  pincode: "pincode",
  subtotal: "subtotal",
  shipping: "shipping",
  discount: "discount",
  total: "total",
  razorpayOrderId: "razorpay_order_id",
  paymentId: "payment_id",
  method: "payment_method",
  notes: "notes",
  shipmentStatus: "shipment_status",
  courier: "courier",
  awb: "awb",
  trackingUrl: "tracking_url",
  shiprocketOrderId: "shiprocket_order_id",
  referralUsed: "referral_code_used",
  couponUsed: "coupon_code_used",
  referralCode: "own_referral_code",
};

/** Never throws: the dashboard copy must not break checkout or webhooks. */
export async function mirrorOrder(orderNo: string, data: SheetRow, items?: PricedLine[]) {
  if (!supabaseConfigured()) return;
  const row: Record<string, unknown> = {};
  if (data.status) row.status = STATUS[data.status];
  for (const [key, column] of Object.entries(COLUMN)) {
    const value = data[key as keyof SheetRow];
    if (value !== undefined && value !== null && value !== "") row[column!] = value;
  }
  try {
    await rpc("record_order", {
      p_order_no: orderNo,
      p_data: row,
      p_items: items?.map((l) => ({ slug: l.slug, name: l.name, qty: l.qty, unitPrice: l.unitPrice, lineTotal: l.lineTotal })) ?? null,
    });
  } catch (error) {
    console.error("[orders-db] write failed", { orderNo, message: String(error) });
  }
}
