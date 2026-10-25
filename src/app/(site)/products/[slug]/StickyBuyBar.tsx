"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AddToCart } from "@/components/CartButtons";
import { discount, inr } from "@/lib/products";
import { altFor } from "@/lib/imageAlt";

// Add-to-cart bar. On mobile it stays docked to the bottom whenever the main buy
// buttons are off screen; on desktop it floats in once you scroll past them.
export function StickyBuyBar({
  slug,
  name,
  price,
  mrp,
  image,
  backdrop,
}: {
  slug: string;
  name: string;
  price: number;
  mrp: number;
  image: string;
  backdrop: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const box = document.getElementById("buy-box");
    if (!box) return;
    const mobile = window.matchMedia("(max-width: 767px)");
    const io = new IntersectionObserver(([e]) =>
      setShow(!e.isIntersecting && (mobile.matches || e.boundingClientRect.top < 0)),
    );
    io.observe(box);
    return () => io.disconnect();
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 transition-all duration-500 ease-out md:inset-x-2 md:bottom-5 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[120%] opacity-0"
      }`}
    >
      <div className="mx-auto flex max-w-[720px] items-center gap-3 border-t border-ink/10 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgb(0_0_0/0.12)] md:rounded-full md:border-0 md:p-2 md:shadow-[0_12px_40px_rgb(0_0_0/0.18)] md:ring-1 md:ring-black/10">
        <Image
          src={image}
          alt={altFor(image)}
          width={48}
          height={48}
          className="size-12 rounded-xl object-cover md:rounded-full"
          style={{ background: backdrop }}
        />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[15px] font-bold">{name}</p>
          <p className="text-[15px]">
            <span className="font-bold">{inr(price)}</span>{" "}
            <span className="text-sm text-ink/60 line-through">{inr(mrp)}</span>{" "}
            <span className="text-sm font-semibold text-ink/80">{discount({ price, mrp })}% off</span>
          </p>
        </div>
        <AddToCart slug={slug} buyNow label="Add to cart" className="h-12! shrink-0 px-6! text-base!" />
      </div>
    </div>
  );
}
