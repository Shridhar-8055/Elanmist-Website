import Link from "next/link";
import { shippingInfo } from "@/lib/products";
import { ClockIcon, ReturnIcon, TruckIcon } from "./icons";

// Shipping, delivery and returns at a glance — shown in the buy box and the cart.
export function DeliveryInfo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const rows = [
    { Icon: TruckIcon, title: shippingInfo.freeShipping, body: shippingInfo.cod },
    { Icon: ClockIcon, title: shippingInfo.dispatch, body: shippingInfo.delivery },
    {
      Icon: ReturnIcon,
      title: "Replacement for damaged or wrong items",
      body: "Report within 48 hours of delivery with an unboxing video. Opened products can't be returned.",
    },
  ];

  return (
    <div className={`rounded-[22px] border border-ink/10 bg-pale/60 ${className}`}>
      <ul className="divide-y divide-ink/10">
        {rows.map(({ Icon, title, body }) => (
          <li key={title} className={`flex gap-3 ${compact ? "px-4 py-3" : "px-5 py-4"}`}>
            <Icon className="mt-0.5 size-5 shrink-0 text-ink" />
            <div>
              <p className={`font-semibold text-ink ${compact ? "text-sm" : "text-[15px]"}`}>{title}</p>
              {!compact && <p className="mt-0.5 text-sm leading-snug text-ink/70">{body}</p>}
            </div>
          </li>
        ))}
      </ul>
      <Link
        href="/policies/shipping-and-returns"
        className={`block border-t border-ink/10 text-sm font-semibold text-ink underline underline-offset-4 ${
          compact ? "px-4 py-3" : "px-5 py-3.5"
        }`}
      >
        Shipping &amp; returns policy
      </Link>
    </div>
  );
}
