"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { CheckIcon, ClockIcon, GiftIcon, TruckIcon } from "@/components/icons";
import { inr, shippingInfo } from "@/lib/products";
import { LAST_ORDER_KEY, type LastOrder } from "@/lib/razorpay-checkout";

// The confirmed order is handed over in sessionStorage by the checkout page.
const noop = () => () => {};
function readOrder(): string | null {
  try {
    return sessionStorage.getItem(LAST_ORDER_KEY);
  } catch {
    return null;
  }
}

export function OrderSuccess() {
  const raw = useSyncExternalStore(noop, readOrder, () => null);
  let order: LastOrder | null = null;
  try {
    order = raw ? (JSON.parse(raw) as LastOrder) : null;
  } catch {}

  return (
    <section className="px-4 pb-24 pt-12 md:pt-20">
      <div className="mx-auto max-w-[720px] text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-ink text-white">
          <CheckIcon className="size-8" />
        </span>
        <h1 className="mt-6 text-[clamp(30px,4.4vw,52px)] font-extrabold leading-tight tracking-tight">
          {order ? `Thank you, ${order.customer.name.split(" ")[0]}!` : "Thank you for your order!"}
        </h1>
        <p className="mt-3 text-lg text-ink/75">Your payment was successful and your order is confirmed.</p>

        {order && (
          <div className="mt-10 rounded-[28px] bg-pale p-6 text-left md:p-8">
            <div className="flex flex-wrap justify-between gap-3 border-b border-ink/10 pb-4">
              <div>
                <p className="text-sm text-ink/70">Order number</p>
                <p className="text-lg font-bold">{order.receipt}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-ink/70">Payment ID</p>
                <p className="font-mono text-sm font-semibold">{order.paymentId}</p>
              </div>
            </div>
            <ul className="divide-y divide-ink/10">
              {order.totals.lines.map((l) => (
                <li key={l.slug} className="flex justify-between py-3 text-base">
                  <span>
                    {l.name} <span className="text-ink/60">× {l.qty}</span>
                  </span>
                  <span className="font-semibold">{inr(l.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-ink/10 pt-4 text-base">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{inr(order.totals.subtotal)}</dd>
              </div>
              {!!order.totals.discount && (
                <div className="flex justify-between">
                  <dt>Referral: 1 product free</dt>
                  <dd>− {inr(order.totals.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt>Delivery</dt>
                <dd>{order.totals.shipping ? inr(order.totals.shipping) : "Free"}</dd>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <dt>Total paid</dt>
                <dd>{inr(order.totals.total)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-ink/70">
              We&apos;ve emailed your order details and a tracking link to{" "}
              <strong className="text-ink">{order.customer.email}</strong>. Keep your order number handy if you contact us.
            </p>
          </div>
        )}

        {order?.referralCode && <ShareCode code={order.referralCode} />}

        <ol className="mt-8 grid gap-3 text-left sm:grid-cols-2">
          <li className="flex gap-3 rounded-[22px] border border-ink/10 p-5">
            <ClockIcon className="mt-0.5 size-6 shrink-0" />
            <span>
              <span className="block font-semibold">{shippingInfo.dispatch}</span>
              <span className="text-sm text-ink/70">Not on Sundays or public holidays.</span>
            </span>
          </li>
          <li className="flex gap-3 rounded-[22px] border border-ink/10 p-5">
            <TruckIcon className="mt-0.5 size-6 shrink-0" />
            <span>
              <span className="block font-semibold">Delivered in 5–7 business days</span>
              <span className="text-sm text-ink/70">Tracking details follow by SMS and email.</span>
            </span>
          </li>
        </ol>

        <p className="mt-8 text-base text-ink/75">
          Questions? Email{" "}
          <a href={`mailto:${shippingInfo.support.email}`} className="font-semibold text-ink underline underline-offset-4">
            {shippingInfo.support.email}
          </a>{" "}
          or call{" "}
          <a href={`tel:+91${shippingInfo.support.phone}`} className="font-semibold text-ink underline underline-offset-4">
            +91 {shippingInfo.support.phone}
          </a>
          .
        </p>
        {order && (
          <Link
            href={`/track?order=${encodeURIComponent(order.receipt)}`}
            className="mr-3 mt-8 inline-flex h-12 items-center gap-2 rounded-full border-2 border-ink px-7 text-base font-semibold"
          >
            <TruckIcon className="size-5" /> Track your order
          </Link>
        )}
        <Link href="/shop" className="pill-dark mt-8 inline-flex h-12 items-center rounded-full px-7 text-base font-semibold">
          Continue shopping
        </Link>
      </div>
    </section>
  );
}

// The buyer's own referral code, with copy and WhatsApp share.
function ShareCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const message = `I love Elanmist skincare! Use my code ${code} on elanmist.com and get one product free — you only pay delivery.`;
  return (
    <div className="mt-8 rounded-[28px] bg-wine p-6 text-left text-white md:p-8">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#e8a6b3]">
        <GiftIcon className="size-4" /> Share with a friend
      </p>
      <p className="mt-3 text-lg font-semibold">Give a friend one Elanmist product free.</p>
      <p className="mt-1 text-sm text-white/75">They pay only delivery. Your code works once and can&apos;t be used on your own orders.</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="rounded-2xl border border-dashed border-white/50 px-5 py-3 font-mono text-2xl font-bold tracking-[0.2em]">
          {code}
        </span>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {}
          }}
          className="h-12 rounded-full bg-white px-6 text-sm font-semibold text-ink"
        >
          <span aria-live="polite">{copied ? "Copied ✓" : "Copy code"}</span>
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 items-center rounded-full border-2 border-white px-6 text-sm font-semibold hover:bg-white hover:text-ink"
        >
          Share on WhatsApp
        </a>
      </div>
    </div>
  );
}
