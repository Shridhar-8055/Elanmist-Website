"use client";

import Image from "next/image";
import { useState } from "react";
import { altFor } from "@/lib/imageAlt";

export type Pillar = {
  title: string;
  body: string;
  // Panel colour — taken from the product photo backdrops so the section feels native to Elanmist.
  tone: string;
  glow: string;
  image: string;
  // Focal point for the crop, e.g. "50% 60%".
  focus?: string;
};

// Expanding pillar panels: one opens wide on hover/tap while the others fold into
// vertical labels. On mobile they stack as a simple accordion.
export function Philosophy({
  kicker,
  statement,
  emphasis,
  pillars,
}: {
  kicker: string;
  statement: string;
  emphasis: string;
  pillars: Pillar[];
}) {
  const [active, setActive] = useState(0);

  return (
    <section className="bg-white px-4 py-20 md:py-28">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mist">{kicker}</p>
            <h2 className="mt-5 max-w-[18ch] font-serif text-[clamp(38px,5.2vw,76px)] leading-[1.02] tracking-[-0.01em]">
              {statement} <em className="text-mist">{emphasis}</em>
            </h2>
          </div>
          <p className="max-w-[30ch] text-sm leading-relaxed text-mist md:text-right">
            Four principles behind every Elanmist formula. Hover or tap to explore.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-2.5 md:mt-16 md:h-[480px] md:flex-row">
          {pillars.map((p, i) => {
            const open = active === i;
            return (
              <button
                key={p.title}
                type="button"
                aria-expanded={open}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className={`group relative overflow-hidden rounded-[28px] text-left text-white transition-[flex-grow,height] duration-[800ms] ease-circ md:h-full md:min-w-[88px] md:rounded-[36px] ${
                  open ? "h-[300px] md:flex-[3.2]" : "h-[76px] md:flex-1"
                }`}
                style={{ background: p.tone }}
              >
                <Image
                  src={p.image}
                  alt={altFor(p.image)}
                  fill
                  // Eager: lazy-loading stalls while the panel widths are animating.
                  loading="eager"
                  sizes="(min-width: 768px) 60vw, 100vw"
                  className={`object-cover transition-[transform,opacity] duration-[1200ms] ease-out ${
                    open ? "scale-100 opacity-100" : "scale-110 opacity-60"
                  }`}
                  style={{ objectPosition: p.focus ?? "50% 55%" }}
                />
                {/* Tint in the panel colour so type stays legible over the photo. */}
                <span
                  aria-hidden
                  className={`absolute inset-0 transition-opacity duration-700 ${open ? "opacity-100" : "opacity-90"}`}
                  style={{
                    background: open
                      ? `linear-gradient(to top, ${p.tone} 8%, ${p.tone}cc 32%, transparent 72%), linear-gradient(to bottom, ${p.tone}99, transparent 30%)`
                      : `linear-gradient(to top, ${p.tone}, ${p.tone}b3)`,
                  }}
                />
                <span
                  aria-hidden
                  className={`absolute -bottom-24 -right-24 size-[360px] rounded-full mix-blend-soft-light blur-3xl transition-opacity duration-700 ${
                    open ? "opacity-60" : "opacity-20"
                  }`}
                  style={{ background: p.glow }}
                />

                {/* Folded label (desktop) */}
                <span
                  className={`absolute bottom-8 left-1/2 hidden origin-center -translate-x-1/2 whitespace-nowrap text-sm font-semibold tracking-wide transition-opacity duration-300 [writing-mode:vertical-rl] rotate-180 md:block ${
                    open ? "opacity-0" : "opacity-80 delay-300"
                  }`}
                >
                  {p.title}
                </span>

                <span className="relative flex h-full flex-col p-6 md:p-9">
                  <span className="flex items-center justify-between gap-4">
                    <span className="font-serif text-2xl italic text-white/85 md:text-3xl">0{i + 1}</span>
                    <span className="text-base font-semibold md:hidden">{p.title}</span>
                  </span>
                  <span
                    className={`mt-auto transition-all duration-500 ${
                      open ? "translate-y-0 opacity-100 delay-200" : "pointer-events-none translate-y-4 opacity-0"
                    }`}
                  >
                    <span className="hidden font-serif text-[clamp(34px,3.4vw,52px)] leading-none md:block">
                      {p.title}
                    </span>
                    <span className="mt-4 block max-w-[36ch] text-[15px] leading-relaxed text-white/75">{p.body}</span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
