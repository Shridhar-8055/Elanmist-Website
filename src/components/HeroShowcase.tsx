"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { altFor } from "@/lib/imageAlt";
import { inr, products } from "@/lib/products";
import { ArrowRight, CheckIcon } from "./icons";

// Studio shots on white: blended with `multiply`, the white melts into the coloured stage
// so the products appear to float. (Not used elsewhere on the home page.)
const STAGE_IMAGE: Record<string, string> = {
  "hybrid-sunscreen": "/images/shoot/sunscreen-tube.webp",
  "glutathione-cream": "/images/shoot/cream-tube.webp",
  "hydroboost-gel": "/images/shoot/gel-jar-box.webp",
};

// Where each product sits on the stage when it is / isn't in the spotlight.
const SLOTS = [
  { x: -30, y: -4, rotate: -9, scale: 0.66, depth: 18 },
  { x: 0, y: -10, rotate: 0, scale: 1, depth: 34 },
  { x: 30, y: -2, rotate: 9, scale: 0.66, depth: 22 },
];

const trust = ["Dermatologically tested", "Paraben-free", "Made in India"];

// Home hero: the three products floating on a light stage. The spotlight moves on its own
// every few seconds; tap a product (or its tab) to pick it, and on desktop the trio drifts
// with the pointer for a little depth.
export function HeroShowcase() {
  const [active, setActive] = useState(1);
  const [paused, setPaused] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const stage = useRef<HTMLDivElement>(null);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (paused || reduced.current) return;
    const t = setInterval(() => setActive((a) => (a + 1) % products.length), 4200);
    return () => clearInterval(t);
  }, [paused]);

  const current = products[active];

  // Slot order: the active product takes the middle slot; the others keep their sides.
  const slotFor = (i: number) => {
    const offset = (i - active + products.length) % products.length;
    return offset === 0 ? SLOTS[1] : offset === 1 ? SLOTS[2] : SLOTS[0];
  };

  return (
    <section
      aria-label="Elanmist skincare"
      className="relative isolate overflow-hidden bg-[#f6eee9] pt-[68px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        setTilt({ x: 0, y: 0 });
      }}
      onMouseMove={(e) => {
        if (reduced.current || !stage.current) return;
        const r = stage.current.getBoundingClientRect();
        setTilt({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 });
      }}
    >
      {/* Colour glow that follows the spotlighted product. */}
      {products.map((p, i) => (
        <span
          key={p.slug}
          aria-hidden
          className="pointer-events-none absolute -right-[10%] top-[8%] -z-10 size-[min(90vw,900px)] rounded-full blur-3xl transition-opacity duration-1000"
          style={{ background: `radial-gradient(circle, ${p.accent} 0%, transparent 65%)`, opacity: i === active ? 0.7 : 0 }}
        />
      ))}
      {/* Watermark word */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-[0.18em] left-1/2 -z-10 -translate-x-1/2 select-none whitespace-nowrap font-serif text-[clamp(120px,22vw,340px)] italic leading-none text-ink/[0.04]"
      >
        Radiance
      </span>

      <div className="mx-auto grid max-w-[1440px] items-center gap-2 px-5 pb-10 pt-6 md:min-h-[calc(100svh-36px-68px)] md:grid-cols-[1fr_1.1fr] md:gap-10 md:px-[6vw] md:pb-14">
        {/* Copy */}
        <div className="animate-fade-up text-center md:text-left">
          <p className="font-serif text-[clamp(20px,1.6vw,26px)] italic text-mist">Imagined with nature, proven by science</p>
          <h1 className="display mt-3 text-[clamp(44px,5.6vw,88px)] leading-[0.95] text-ink">Embrace Your Natural Radiance</h1>
          <p className="mx-auto mt-5 max-w-[42ch] text-[16px] leading-relaxed text-ink/70 md:mx-0 md:text-[17px]">
            Science-backed formulas with Indian Gooseberry and proven actives, for luminous, healthy skin.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2 md:mt-8 md:justify-start md:gap-3">
            <Link href="/shop" className="pill-dark inline-flex h-12 items-center gap-2 rounded-full px-4 text-[15px] font-semibold md:h-[52px] md:gap-2.5 md:px-7 md:text-base">
              Shop the range <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/skin-quiz"
              className="inline-flex h-12 items-center rounded-full border-2 border-ink px-4 text-[15px] font-semibold md:h-[52px] md:px-6 md:text-base text-ink transition-colors hover:bg-ink hover:text-white"
            >
              Find my match
            </Link>
          </div>
          <ul className="mt-8 hidden flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-ink/70 md:flex">
            {trust.map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <CheckIcon className="size-4 text-emerald-700" /> {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Stage */}
        <div className="relative mx-auto w-full max-w-[640px]">
          <div
            ref={stage}
            className="relative aspect-[5/4] w-full"
            role="group"
            aria-roledescription="product showcase"
            aria-label={`Showing ${current.name}`}
          >
            {/* Floor shadow */}
            <span aria-hidden className="absolute bottom-[8%] left-1/2 h-[9%] w-[70%] -translate-x-1/2 rounded-[50%] bg-ink/15 blur-2xl" />
            {products.map((p, i) => {
              const s = slotFor(i);
              const front = i === active;
              const dx = s.x + tilt.x * (s.depth / 4);
              const dy = s.y + tilt.y * (s.depth / 6);
              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Show ${p.name}`}
                  aria-pressed={front}
                  className="pointer-events-none absolute left-1/2 top-1/2 w-[68%] mix-blend-multiply outline-none transition-[transform,filter] duration-700 ease-[cubic-bezier(.22,1,.36,1)] focus-visible:drop-shadow-[0_0_0_3px_#0d0b0b] motion-reduce:transition-none"
                  style={{
                    transform: `translate(calc(-50% + ${dx}%), calc(-50% + ${dy}%)) rotate(${s.rotate + tilt.x * 4}deg) scale(${s.scale})`,
                    zIndex: front ? 3 : 1,
                    filter: front ? "brightness(1.07) contrast(1.06)" : "brightness(1.1) contrast(1.06) saturate(0.85)",
                  }}
                >
                  {/* The photo has wide white margins, so only the product itself takes taps. */}
                  <span aria-hidden className="pointer-events-auto absolute inset-x-[30%] inset-y-[10%] cursor-pointer" />
                  <span className="relative block aspect-square">
                    <Image
                      src={STAGE_IMAGE[p.slug]}
                      alt={altFor(STAGE_IMAGE[p.slug])}
                      fill
                      preload={i === 1}
                      sizes="(min-width: 768px) 42vw, 68vw"
                      draggable={false}
                      className="object-contain"
                    />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Spotlight card: under the stage on phones, floating over its corner on desktop. */}
            <div
              key={current.slug}
              className="relative z-10 mx-auto -mt-[4%] w-full max-w-[340px] rounded-2xl md:absolute md:right-0 md:top-[58%] md:mt-0 md:w-[260px] bg-white/85 p-4 text-left shadow-[0_16px_40px_rgb(0_0_0/0.12)] ring-1 ring-black/5 backdrop-blur motion-safe:animate-[fade-up_.5s_ease-out]"
              aria-live="polite"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "#6b635e" }}>
                {current.tagline}
              </p>
              <p className="mt-1 text-lg font-bold leading-tight text-ink">{current.name}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-ink">
                  <span className="text-lg font-black">{inr(current.price)}</span>{" "}
                  <span className="text-sm text-ink/50 line-through">{inr(current.mrp)}</span>
                </p>
                <Link
                  href={`/products/${current.slug}`}
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-white"
                >
                  View <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

          {/* Product tabs */}
          <div role="tablist" aria-label="Choose a product" className="mx-auto mt-4 flex w-fit gap-1 rounded-full bg-white/70 p-1 ring-1 ring-black/5 backdrop-blur">
            {products.map((p, i) => (
              <button
                key={p.slug}
                type="button"
                role="tab"
                aria-selected={i === active}
                onClick={() => {
                  setActive(i);
                  setPaused(true);
                }}
                className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                  i === active ? "bg-ink text-white" : "text-ink/65 hover:text-ink"
                }`}
              >
                <span aria-hidden className="size-2.5 rounded-full" style={{ background: p.accent }} />
                {p.shortName}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
