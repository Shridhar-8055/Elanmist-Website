"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/lib/cart";
import { shippingFor } from "@/lib/pricing";
import { FREE_SHIPPING_THRESHOLD, inr, products, shippingInfo } from "@/lib/products";
import { CloseIcon, LockIcon, MinusIcon, PlusIcon, TruckIcon } from "./icons";
import { altFor } from "@/lib/imageAlt";

export function CartDrawer() {
  const { isOpen, close, lines, subtotal, mrpTotal, setQty, remove, add, count } = useCart();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const inCart = new Set(lines.map((l) => l.slug));
  const suggestions = products.filter((p) => !inCart.has(p.slug)).slice(0, 2);

  return (
    <div className={`fixed inset-0 z-[60] ${isOpen ? "" : "pointer-events-none"}`} aria-hidden={!isOpen}>
      <div
        onClick={close}
        className={`absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-500 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-label="Cart"
        className={`absolute inset-y-2 right-2 flex w-[min(440px,calc(100%-16px))] flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl transition-transform duration-[650ms] ease-circ ${
          isOpen ? "translate-x-0" : "translate-x-[110%]"
        }`}
      >
        <div className="flex items-center justify-between px-6 pb-4 pt-6">
          <h2 className="display text-[26px]">
            Your Ritual, <span className="text-mist">Almost Ready</span>
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close cart"
            className="grid size-9 place-items-center rounded-full bg-pale"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4">
          {lines.length === 0 && (
            <div className="rounded-[24px] bg-pale px-6 py-10 text-center">
              <p className="text-sm text-mist">Your bag is empty.</p>
              <Link
                href="/shop"
                onClick={close}
                className="pill-dark mt-5 inline-flex h-11 items-center rounded-full px-6 text-sm"
              >
                Continue shopping
              </Link>
            </div>
          )}
          {lines.map(({ product: p, qty }) => (
            <div key={p.slug} className="flex gap-4 rounded-[24px] bg-pale p-3">
              <Image
                src={p.image}
                alt={p.name}
                width={88}
                height={110}
                className="h-[110px] w-[88px] rounded-[16px] object-cover"
                style={{ background: p.backdrop }}
              />
              <div className="flex min-w-0 flex-1 flex-col py-1">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/products/${p.slug}`} onClick={close} className="text-[15px] font-bold leading-tight">
                    {p.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(p.slug)}
                    className="text-xs text-mist underline-offset-2 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <p className="mt-0.5 text-xs text-mist">{p.size}</p>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex h-9 items-center rounded-full bg-white">
                    <button
                      type="button"
                      aria-label="Decrease"
                      onClick={() => setQty(p.slug, qty - 1)}
                      className="grid size-9 place-items-center"
                    >
                      <MinusIcon className="size-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold tabular-nums">{qty}</span>
                    <button
                      type="button"
                      aria-label="Increase"
                      onClick={() => setQty(p.slug, qty + 1)}
                      className="grid size-9 place-items-center"
                    >
                      <PlusIcon className="size-3.5" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{inr(p.price * qty)}</p>
                    <p className="text-[11px] text-mist line-through">{inr(p.mrp * qty)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {suggestions.length > 0 && lines.length > 0 && (
            <div className="pt-3">
              <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-mist">
                Complete the routine
              </p>
              <div className="grid grid-cols-2 gap-3">
                {suggestions.map((p) => (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => add(p.slug)}
                    className="group relative overflow-hidden rounded-[20px] text-left text-white"
                    style={{ background: p.backdrop }}
                  >
                    <Image src={p.image} alt={altFor(p.image)} width={200} height={160} className="h-28 w-full object-cover opacity-90" />
                    <span className="block px-3 pb-3 pt-2 text-xs font-bold leading-tight">{p.name}</span>
                    <span className="flex items-center justify-between px-3 pb-3 text-xs">
                      {inr(p.price)}
                      <span className="grid size-7 place-items-center rounded-full bg-white/20 transition group-hover:bg-white group-hover:text-ink">
                        <PlusIcon className="size-3.5" />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-pale-2 px-6 pb-6 pt-5">
          {count > 0 && (
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-ink">
                <TruckIcon className="size-5 shrink-0" />
                {subtotal >= FREE_SHIPPING_THRESHOLD
                  ? "You've unlocked free shipping"
                  : `Add ${inr(FREE_SHIPPING_THRESHOLD - subtotal)} more for free shipping (₹49 otherwise)`}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-pale">
                <div
                  className="h-full rounded-full bg-ink transition-[width] duration-500"
                  style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                />
              </div>
            </div>
          )}
          {mrpTotal > subtotal && (
            <div className="flex justify-between text-sm text-ink/70">
              <span>You save</span>
              <span className="font-semibold text-ink">{inr(mrpTotal - subtotal)}</span>
            </div>
          )}
          {count > 0 && (
            <div className="flex justify-between text-sm text-ink/70">
              <span>Delivery</span>
              <span className="font-semibold text-ink">{shippingFor(subtotal) ? inr(shippingFor(subtotal)) : "Free"}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-2xl font-black tracking-tight">{inr(subtotal + (count ? shippingFor(subtotal) : 0))}</span>
          </div>
          <p className="text-sm text-ink/70">
            Taxes included. {shippingInfo.dispatch}; delivery in 5–7 business days.{" "}
            <Link href="/policies/shipping-and-returns" onClick={close} className="font-semibold text-ink underline underline-offset-2">
              Shipping &amp; returns
            </Link>
          </p>
          {count > 0 ? (
            <Link
              href="/checkout"
              onClick={close}
              className="pill-dark flex h-[54px] w-full items-center justify-center gap-2 rounded-full text-base font-semibold"
            >
              <LockIcon className="size-4" /> Check out · {inr(subtotal + shippingFor(subtotal))}
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="pill-dark flex h-[54px] w-full items-center justify-center gap-2 rounded-full text-base font-semibold opacity-40"
            >
              <LockIcon className="size-4" /> Check out
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
