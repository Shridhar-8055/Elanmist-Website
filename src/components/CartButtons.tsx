"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { ArrowRight, PlusIcon } from "./icons";

// Quick-add pill with loading → "Added" feedback. Solid colours keep it readable on
// any background: white on dark surfaces, ink on light ones.
export function QuickAdd({
  slug,
  tone = "onDark",
  className = "",
}: {
  slug: string;
  tone?: "onDark" | "onLight";
  className?: string;
}) {
  const { add } = useCart();
  const [state, setState] = useState<"idle" | "loading" | "added">("idle");

  return (
    <button
      type="button"
      aria-label="Add to cart"
      disabled={state !== "idle"}
      onClick={() => {
        setState("loading");
        setTimeout(() => {
          add(slug);
          setState("added");
          setTimeout(() => setState("idle"), 1400);
        }, 450);
      }}
      className={`relative flex h-12 min-w-[88px] shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full px-4 text-[15px] font-semibold transition-transform active:scale-95 ${
        tone === "onDark" ? "bg-white text-ink" : "bg-ink text-white"
      } ${className}`}
    >
      {state === "idle" && (
        <>
          <PlusIcon className="size-4" /> Add
        </>
      )}
      {state === "loading" && (
        <span className="size-4 animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-current/30 border-t-current" />
      )}
      {state === "added" && <span aria-live="polite">Added ✓</span>}
    </button>
  );
}

export function BuyButton({
  slug,
  label,
  tone = "onLight",
  className = "",
}: {
  slug: string;
  label: string;
  tone?: "onDark" | "onLight";
  className?: string;
}) {
  return (
    <Link
      href={`/products/${slug}`}
      className={`inline-flex h-12 items-center justify-center gap-2.5 whitespace-nowrap rounded-full px-6 text-[15px] font-semibold ${
        tone === "onDark" ? "border-2 border-white text-white hover:bg-white hover:text-ink" : "pill-dark"
      } transition-colors ${className}`}
    >
      {label}
      <ArrowRight className="size-4" />
    </Link>
  );
}

export function AddToCart({
  slug,
  buyNow = false,
  label,
  className = "",
}: {
  slug: string;
  buyNow?: boolean;
  label?: string;
  className?: string;
}) {
  const { add, open } = useCart();
  return (
    <button
      type="button"
      onClick={() => {
        add(slug);
        open();
      }}
      className={
        buyNow
          ? `pill-dark flex h-[52px] items-center justify-center rounded-full px-8 text-base font-semibold ${className}`
          : `flex h-[52px] items-center justify-center rounded-full border-2 border-ink bg-white px-6 text-base font-semibold text-ink transition-colors hover:bg-ink hover:text-white ${className}`
      }
    >
      {label ?? (buyNow ? "Buy Now" : "Add to cart")}
    </button>
  );
}
