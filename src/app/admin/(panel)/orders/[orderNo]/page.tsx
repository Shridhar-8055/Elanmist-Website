import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrder } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseConfigured } from "@/lib/supabase-admin";
import { Card, inr, NotConnected, ShipmentBadge, StatusBadge, when } from "../../../ui";

export async function generateMetadata({ params }: PageProps<"/admin/orders/[orderNo]">): Promise<Metadata> {
  return { title: `Order ${(await params).orderNo}` };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-[0.1em] text-ink/50">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}

export default async function OrderPage({ params }: PageProps<"/admin/orders/[orderNo]">) {
  await requireAdmin();
  if (!supabaseConfigured()) return <NotConnected />;
  const { orderNo } = await params;
  const data = await getOrder(decodeURIComponent(orderNo));
  if (!data) notFound();
  const { order: o, items, previous_orders } = data;
  const paid = o.status === "paid";

  return (
    <>
      <Link href="/admin/orders" className="text-sm font-semibold text-ink/60 hover:text-ink">
        ← All orders
      </Link>
      <div className="mb-6 mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-[24px] font-extrabold tracking-tight md:text-[28px]">{o.order_no}</h1>
        <StatusBadge status={o.status} />
        <ShipmentBadge status={o.shipment_status} awb={o.awb} paid={paid} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card>
            <h2 className="text-base font-bold">Items</h2>
            <table className="mt-3 w-full text-sm">
              <tbody className="divide-y divide-ink/5">
                {items.map((i) => (
                  <tr key={i.slug}>
                    <td className="py-2.5">
                      {i.name} <span className="text-ink/50">× {i.qty}</span>
                    </td>
                    <td className="py-2.5 text-right text-ink/55 tabular-nums">{inr(i.unit_price)} each</td>
                    <td className="py-2.5 text-right font-semibold tabular-nums">{inr(i.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-3 space-y-1.5 border-t border-ink/10 pt-3 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{inr(o.subtotal)}</dd>
              </div>
              {o.discount > 0 && (
                <div className="flex justify-between">
                  <dt>Discount {o.coupon_code_used ? `(coupon ${o.coupon_code_used})` : o.referral_code_used ? `(referral ${o.referral_code_used})` : ""}</dt>
                  <dd className="tabular-nums">−{inr(o.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Delivery</dt>
                <dd className="tabular-nums">{o.shipping ? inr(o.shipping) : "Free"}</dd>
              </div>
              <div className="flex justify-between text-base font-bold">
                <dt>Total {paid ? "paid" : ""}</dt>
                <dd className="tabular-nums">{inr(o.total)}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="text-base font-bold">Delivery</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <Field label="Status">{o.shipment_status ?? (paid ? "Waiting to be sent to Shiprocket" : "Not paid")}</Field>
              <Field label="Shiprocket order">{o.shiprocket_order_id ?? "—"}</Field>
              <Field label="Courier">{o.courier ?? "—"}</Field>
              <Field label="AWB">{o.awb ? <span className="font-mono">{o.awb}</span> : "—"}</Field>
            </dl>
            {o.tracking_url && (
              <a href={o.tracking_url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
                Open courier tracking ↗
              </a>
            )}
            {o.notes && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-600/20">{o.notes}</p>}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="text-base font-bold">Customer</h2>
            <dl className="mt-4 space-y-4">
              <Field label="Name">
                {o.name}
                {previous_orders > 0 && <span className="ml-2 rounded-full bg-pale px-2 py-0.5 text-xs">{previous_orders} earlier order{previous_orders === 1 ? "" : "s"}</span>}
              </Field>
              <Field label="Mobile">
                <a href={`tel:+91${o.phone}`} className="underline underline-offset-2">
                  +91 {o.phone}
                </a>
              </Field>
              <Field label="Email">
                <a href={`mailto:${o.email}`} className="break-all underline underline-offset-2">
                  {o.email}
                </a>
              </Field>
              <Field label="Ship to">
                {o.address1}
                {o.address2 && <>, {o.address2}</>}
                <br />
                {o.city}, {o.state} {o.pincode}
              </Field>
            </dl>
            <Link href={`/admin/customers?q=${o.phone}`} className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
              All orders from this customer
            </Link>
          </Card>

          <Card>
            <h2 className="text-base font-bold">Payment</h2>
            <dl className="mt-4 space-y-4">
              <Field label="Checkout started">{when(o.created_at)}</Field>
              <Field label="Paid">{when(o.paid_at)}</Field>
              <Field label="Method">{o.payment_method ?? "—"}</Field>
              <Field label="Razorpay payment">{o.payment_id ? <span className="font-mono text-xs">{o.payment_id}</span> : "—"}</Field>
              <Field label="Razorpay order">{o.razorpay_order_id ? <span className="font-mono text-xs">{o.razorpay_order_id}</span> : "—"}</Field>
              {o.own_referral_code && (
                <Field label="Referral code given to them">
                  <span className="font-mono">{o.own_referral_code}</span>
                </Field>
              )}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
