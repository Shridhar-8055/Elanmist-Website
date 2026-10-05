import Image from "next/image";
import type { Product } from "@/lib/products";
import { Reveal } from "./InView";

// Ingredient breakdown: arch-framed product photo beside an editorial list of
// actives, each with a glowing swatch, closed with the "free from" promise.
export function FormulaSpotlight({ product: p }: { product: Product }) {
  return (
    <section className="bg-white px-4 py-20 md:py-28">
      <div className="mx-auto grid max-w-[1200px] gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-20">
        <div className="md:sticky md:top-28 md:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mist">What&apos;s inside</p>
          <h2 className="mt-4 font-serif text-[clamp(38px,4.6vw,64px)] leading-[1.02]">
            Inside the <em className="text-mist">formula.</em>
          </h2>
          <div
            className="relative mt-10 aspect-[4/5] max-w-[420px] overflow-hidden rounded-b-[32px] rounded-t-[999px]"
            style={{ background: p.backdrop }}
          >
            <Image
              src={p.image}
              alt={`${p.name} packaging`}
              fill
              sizes="(min-width: 768px) 420px, 90vw"
              className="object-cover object-[50%_58%]"
            />
            <span className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-ink backdrop-blur">
              {p.ingredients.length} key actives · {p.size}
            </span>
          </div>
        </div>

        <div>
          <ol className="divide-y divide-pale-2 border-y border-pale-2">
            {p.ingredients.map((ing, i) => (
              <li key={ing.name}>
                <Reveal delay={i * 70}>
                  <div className="group flex items-start gap-5 rounded-[24px] px-2 py-7 transition-colors duration-300 hover:bg-pale md:gap-7 md:px-5">
                    <span
                      aria-hidden
                      className="mt-1 size-12 shrink-0 rounded-full shadow-[0_8px_24px_-8px_rgb(0_0_0/0.25)] transition-transform duration-700 ease-bouncy group-hover:scale-110 md:size-14"
                      style={{ background: `radial-gradient(circle at 32% 28%, #ffffffb0, transparent 55%), ${ing.swatch}` }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="font-serif text-[clamp(24px,2.4vw,34px)] leading-tight">{ing.name}</h3>
                        <span className="font-serif text-lg italic text-mist-soft">0{i + 1}</span>
                      </div>
                      <p className="mt-1.5 max-w-[46ch] text-[15px] leading-relaxed text-mist">{ing.note}</p>
                    </div>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>

          <div className="mt-10 rounded-[28px] p-7 text-white" style={{ background: p.backdrop }}>
            <p className="font-serif text-xl italic text-white/85">Thoughtfully free from</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {p.freeFrom.map((f) => (
                <li key={f} className="rounded-full bg-white/10 px-4 py-2 text-sm ring-1 ring-white/15">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
