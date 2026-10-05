"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { altFor } from "@/lib/imageAlt";

// Auto-cycling deck of cards: the active card sits on top, the next two peek out
// underneath (the "Why Choose" block in the reference).
export function StackedCards({
  heading,
  cards,
  image,
  backdrop,
}: {
  heading: string;
  cards: { title: string; body: string }[];
  image: string;
  backdrop: string;
}) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % cards.length), 3800);
    return () => clearInterval(t);
  }, [cards.length]);

  return (
    <section className="relative overflow-hidden" style={{ background: backdrop }}>
      <div className="absolute inset-y-0 left-0 w-full md:w-3/5">
        <Image src={image} alt={altFor(image)} fill sizes="60vw" className="photo-fade object-cover object-center opacity-90" />
      </div>
      <div className="relative z-10 flex min-h-[640px] items-end justify-center p-5 pb-24 md:items-center md:justify-end md:p-16">
        <div className="w-full max-w-[560px]">
          <h2 className="mb-8 text-center text-[clamp(22px,3vw,36px)] font-bold leading-tight text-white">{heading}</h2>
          <div className="relative h-[200px] md:h-[250px]">
            {cards.map((c, i) => {
              const offset = (i - active + cards.length) % cards.length;
              const style =
                offset === 0
                  ? "z-30 opacity-100 translate-y-0 scale-100"
                  : offset === 1
                    ? "z-20 opacity-100 translate-y-[14px] scale-[0.97] [clip-path:inset(60%_0_0_0_round_32px)]"
                    : offset === 2
                      ? "z-10 opacity-100 translate-y-[26px] scale-[0.95] [clip-path:inset(75%_0_0_0_round_32px)]"
                      : "z-0 opacity-0 -translate-y-8 scale-95";
              return (
                <article
                  key={c.title}
                  className={`absolute inset-0 flex flex-col justify-center rounded-[32px] bg-pale px-6 text-center shadow-[0_12px_0_rgb(0_0_0/0.05)] transition-all duration-500 ease-[cubic-bezier(.4,0,.2,1)] md:px-12 ${style}`}
                >
                  <h3 className="text-[clamp(18px,2vw,26px)] font-bold">{c.title}</h3>
                  <p className="mt-4 text-sm leading-snug text-mist">{c.body}</p>
                </article>
              );
            })}
          </div>
          <div className="mt-10 flex justify-center gap-1">
            {cards.map((c, i) => (
              <button
                key={c.title}
                type="button"
                aria-label={`Show ${c.title}`}
                onClick={() => setActive(i)}
                className="grid h-11 place-items-center px-1"
              >
                <span className={`block h-1.5 rounded-full bg-white/90 transition-all duration-300 ${i === active ? "w-10" : "w-1.5 opacity-60"}`} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
