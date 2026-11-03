"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SHIPPING_FEE } from "@/lib/products";
import { CouponArt, couponPattern } from "./CouponArt";
import { ArrowRight, GiftIcon } from "./icons";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
// Illustrative codes only — real ones are issued per paid order.
const SAMPLES = ["7KQ9PX", "R3HM8C", "W2ZT5N", "B9LD4Q"];

const steps = [
  { title: "Place an order", body: "Any Elanmist product, paid online." },
  { title: "Get your code", body: "On your order confirmation page and in the email." },
  { title: "Your friend gets one free", body: `They pick any product and pay only ₹${SHIPPING_FEE} delivery.` },
];

/** "ELAN" + six characters that shuffle like a ticket printing, then settle on a sample. */
function ShufflingCode() {
  const [chars, setChars] = useState(SAMPLES[0]);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let sample = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    let cycle: ReturnType<typeof setInterval> | undefined;
    const print = () => {
      sample = (sample + 1) % SAMPLES.length;
      const target = SAMPLES[sample];
      let frame = 0;
      clearInterval(timer);
      timer = setInterval(() => {
        frame++;
        // Lock in one more character every few frames, left to right.
        const locked = Math.floor(frame / 3);
        setChars(
          Array.from(target, (c, i) => (i < locked ? c : ALPHABET[Math.floor(Math.random() * ALPHABET.length)])).join(""),
        );
        if (locked >= target.length) clearInterval(timer);
      }, 45);
    };
    // Only animate while the banner is on screen.
    const io = new IntersectionObserver(([e]) => {
      clearInterval(cycle);
      if (e.isIntersecting) {
        print();
        cycle = setInterval(print, 3600);
      }
    });
    if (ref.current) io.observe(ref.current);
    return () => {
      io.disconnect();
      clearInterval(timer);
      clearInterval(cycle);
    };
  }, []);

  return (
    <span ref={ref} className="font-mono text-[clamp(26px,3.2vw,40px)] font-bold tracking-[0.18em] text-white">
      ELAN<span className="text-[#e8a6b3]" aria-hidden>{chars}</span>
      <span className="sr-only">followed by your own six characters</span>
    </span>
  );
}

// Home-page promotion for the referral programme, styled as a tear-off gift ticket.
export function ReferralBanner() {
  return (
    <section aria-labelledby="referral-heading" className="bg-white px-4 pt-20 md:pt-28">
      <div className="relative mx-auto max-w-[1280px]">
        <div className="relative grid overflow-hidden rounded-[32px] bg-wine text-white md:grid-cols-[1.35fr_1fr] md:rounded-[44px]" style={{ backgroundImage: couponPattern }}>
          {/* Soft glow */}
          <span aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-[380px] rounded-full bg-[#e8a6b3]/20 blur-3xl" />

          {/* Main side */}
          <div className="relative p-7 sm:p-10 md:p-14">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#e8a6b3] ring-1 ring-white/15">
              <GiftIcon className="size-4" /> Share the glow
            </p>
            <h2 id="referral-heading" className="display mt-5 text-[clamp(34px,4.6vw,68px)] leading-[0.98]">
              Give a friend a product. <span className="ml-[0.18em] text-[#e8a6b3]">Free.</span>
            </h2>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/80 md:text-base">
              Every order comes with your own referral code. Share it, and your friend gets any one Elanmist product free —
              they only pay delivery.
            </p>

            <ol className="mt-9 grid gap-3 sm:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.title} className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                  <span className="font-serif text-2xl italic text-[#e8a6b3]">0{i + 1}</span>
                  <p className="mt-2 text-[15px] font-semibold">{s.title}</p>
                  <p className="mt-1 text-sm leading-snug text-white/70">{s.body}</p>
                </li>
              ))}
            </ol>

            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href="/shop" className="inline-flex h-[52px] items-center gap-2.5 rounded-full bg-white px-7 text-[15px] font-semibold text-ink">
                Shop &amp; get your code <ArrowRight className="size-4" />
              </Link>
              <p className="text-sm text-white/70">Have a friend&apos;s code? Enter it at checkout.</p>
            </div>
          </div>

          {/* Tear-off stub. A dotted line and two notches separate it from the main side. */}
          <div className="relative overflow-hidden border-t-2 border-dashed border-white/25 bg-[#1a080b]/60 p-7 sm:p-10 md:overflow-visible md:border-l-2 md:border-t-0 md:p-14">
            <CouponArt />
            <span aria-hidden className="absolute -top-4 left-0 size-8 -translate-x-1/2 rounded-full bg-white md:-left-4 md:top-0 md:-translate-y-1/2 md:translate-x-0" />
            <span aria-hidden className="absolute -top-4 right-0 size-8 translate-x-1/2 rounded-full bg-white md:-left-4 md:bottom-0 md:right-auto md:top-auto md:translate-x-0 md:translate-y-1/2" />

            <div className="relative flex h-full flex-col justify-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Your referral code</p>
              <div className="mt-4 rounded-2xl border border-dashed border-white/40 bg-[#1a080b]/80 px-5 py-5 text-center backdrop-blur-sm">
                <ShufflingCode />
              </div>
              <ul className="mt-6 space-y-2.5 text-sm text-white/80">
                <li className="flex items-center gap-2.5">
                  <span aria-hidden className="size-1.5 rounded-full bg-[#e8a6b3]" /> Friend gets 1 product free
                </li>
                <li className="flex items-center gap-2.5">
                  <span aria-hidden className="size-1.5 rounded-full bg-[#e8a6b3]" /> They pay only ₹{SHIPPING_FEE} delivery
                </li>
                <li className="flex items-center gap-2.5">
                  <span aria-hidden className="size-1.5 rounded-full bg-[#e8a6b3]" /> Each code works once
                </li>
              </ul>
              <p className="mt-6 text-xs leading-relaxed text-white/50">
                Codes can&apos;t be used on your own orders, and each person can redeem one referral.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
