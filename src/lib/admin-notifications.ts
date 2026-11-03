import "server-only";
import { getOrders, type OrderRow } from "./admin-data";

// Admin notifications, derived from the orders table (no extra storage): new paid orders,
// paid orders whose Shiprocket shipment needs a manual step, failed payments, and
// checkouts left unpaid. "Read" state lives in the admin's browser.

export type NotificationKind = "order" | "attention" | "payment_failed" | "abandoned";

export type AdminNotification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  at: string;
  href: string;
};

const ABANDONED_AFTER_MS = 30 * 60 * 1000; // a checkout is only "left unpaid" after 30 minutes

function describe(o: OrderRow): AdminNotification[] {
  const who = [o.name, o.city].filter(Boolean).join(", ");
  const href = `/admin/orders/${encodeURIComponent(o.order_no)}`;
  const items = o.items ? ` · ${o.items}` : "";
  const out: AdminNotification[] = [];

  if (o.status === "paid") {
    const code = o.coupon_code_used ?? o.referral_code_used;
    out.push({
      id: `order:${o.order_no}`,
      kind: "order",
      title: `New order · ₹${o.total.toLocaleString("en-IN")}`,
      body: `${who}${items}${code ? ` · code ${code}` : ""}`,
      at: o.paid_at ?? o.created_at,
      href,
    });
    if (/create manually|setup incomplete/i.test(o.shipment_status ?? "")) {
      out.push({
        id: `attention:${o.order_no}`,
        kind: "attention",
        title: "Shipment needs your action",
        body: `${o.order_no} · ${o.shipment_status}`,
        at: o.paid_at ?? o.created_at,
        href,
      });
    }
  } else if (o.status === "payment_failed" || o.status === "payment_setup_failed") {
    out.push({
      id: `failed:${o.order_no}`,
      kind: "payment_failed",
      title: o.status === "payment_failed" ? "Payment failed" : "Checkout error",
      body: `${who} · ₹${o.total.toLocaleString("en-IN")}${items}`,
      at: o.created_at,
      href,
    });
  } else if (o.status === "awaiting_payment" && Date.now() - new Date(o.created_at).getTime() > ABANDONED_AFTER_MS) {
    out.push({
      id: `abandoned:${o.order_no}`,
      kind: "abandoned",
      title: "Checkout left unpaid",
      body: `${who} · ₹${o.total.toLocaleString("en-IN")} · ${o.phone}`,
      at: o.created_at,
      href,
    });
  }
  return out;
}

/** Newest first. Recent orders of every kind, plus any older shipment that still needs action. */
export async function getAdminNotifications(limit = 50): Promise<AdminNotification[]> {
  const [recent, attention] = await Promise.all([getOrders("", "", 60, 0), getOrders("attention", "", 20, 0)]);
  const byId = new Map<string, AdminNotification>();
  for (const o of [...recent.rows, ...attention.rows]) for (const n of describe(o)) byId.set(n.id, n);
  return [...byId.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
