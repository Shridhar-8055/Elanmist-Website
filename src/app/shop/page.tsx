import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BuyButton, QuickAdd } from "@/components/CartButtons";
import { Reveal } from "@/components/InView";
import { discount, inr, products } from "@/lib/products";
import { altFor } from "@/lib/imageAlt";

export const metadata: Metadata = { title: "Shop All" };

export default function ShopPage() {
  return (
    <div className="px-2 pb-20 md:px-4">
      <div className="mx-auto max-w-[760px] px-3 pb-10 pt-12 text-center md:pb-14 md:pt-16">
        <h1 className="text-[clamp(26px,3.4vw,44px)] font-extrabold leading-[1.1] tracking-tight">
          Science in every formula. <span className="text-mist">Radiance in every tube.</span>
        </h1>
        <p className="mt-4 text-[15px] text-mist">
          {products.length} essentials, all powered with Indian Gooseberry. Made in India.
        </p>
      </div>

      <div className="mx-auto grid max-w-[1800px] gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-[18px]">
        {products.map((p, i) => (
          <Reveal key={p.slug} delay={i * 100}>
            <article
              className="relative aspect-[420/600] overflow-hidden rounded-[32px] text-white shadow-[0_20px_54px_rgb(20_24_34/0.08)] md:rounded-[40px]"
              style={{ background: p.backdrop }}
            >
              <Link href={`/products/${p.slug}`} className="absolute inset-0 z-[2]" aria-label={p.name} />
              <Image
                src={p.image}
                alt={altFor(p.image)}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover object-[50%_65%] transition-transform duration-[1.2s] ease-out hover:scale-[1.03]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-black/5 to-black/85" />
              <div className="pointer-events-none absolute inset-x-5 top-8 z-[3] text-center md:top-10">
                <h2 className="text-[clamp(26px,2.2vw,36px)] font-extrabold leading-none [text-shadow:0_2px_12px_rgb(0_0_0/0.4)]">{p.name}</h2>
                <p className="mx-auto mt-3 max-w-[32ch] text-base font-semibold text-white">{p.tagline}</p>
              </div>
              <div className="absolute bottom-6 left-1/2 z-[4] flex w-[min(calc(100%-28px),340px)] -translate-x-1/2 flex-col items-center gap-3 md:bottom-8">
                <ul className="pointer-events-none flex flex-wrap justify-center gap-1.5 max-md:[&>li:nth-child(2)]:hidden">
                  {p.benefits.slice(0, 2).map((b) => (
                    <li key={b} className="rounded-full bg-black/45 px-3 py-1 text-[13px] font-medium text-white ring-1 ring-white/20 backdrop-blur">
                      {b}
                    </li>
                  ))}
                </ul>
                <p className="flex items-baseline gap-2">
                  <span className="text-2xl font-black">{inr(p.price)}</span>
                  <span className="text-base text-white/80 line-through">{inr(p.mrp)}</span>
                  <span className="rounded-full px-2 py-0.5 text-xs font-bold text-ink" style={{ background: p.accent }}>
                    {discount(p)}% off
                  </span>
                </p>
                <div className="flex w-full items-center gap-2.5">
                  <QuickAdd slug={p.slug} />
                  <BuyButton slug={p.slug} label="View details" tone="onDark" className="flex-1" />
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
