import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/CartButtons";
import { Faq } from "@/components/Faq";
import { FormulaSpotlight } from "@/components/FormulaSpotlight";
import { HowItWorks } from "@/components/HowItWorks";
import { CheckIcon, LeafIcon, ShieldIcon, SparkIcon } from "@/components/icons";
import { DeliveryInfo } from "@/components/DeliveryInfo";
import { Newsletter } from "@/components/Newsletter";
import { Reviews, Stars } from "@/components/Reviews";
import { StackedCards } from "@/components/StackedCards";
import { averageRating, discount, getProduct, inr, products } from "@/lib/products";
import { StickyBuyBar } from "./StickyBuyBar";
import { altFor } from "@/lib/imageAlt";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = getProduct(slug);
  return p ? { title: p.name, description: p.description } : {};
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const p = getProduct(slug);
  if (!p) notFound();

  const avg = averageRating(p.reviews);
  const others = products.filter((x) => x.slug !== p.slug);

  return (
    <>
      {/* GALLERY + BUY BOX */}
      <section className="relative grid md:min-h-svh md:grid-cols-[1.15fr_1fr]" style={{ background: p.backdrop }}>
        <div className="relative h-[58svh] md:sticky md:top-[68px] md:h-[calc(100svh-68px)]">
          <Image
            src={p.image}
            alt={p.imageAlt}
            fill
            preload
            sizes="(min-width: 768px) 55vw, 100vw"
            className="object-cover object-[50%_60%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-black/20" />
        </div>

        <div className="relative flex flex-col justify-center rounded-t-[32px] bg-white px-5 pb-12 pt-9 md:rounded-none md:rounded-l-[48px] md:px-[5vw] md:py-28">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink/70">
            <Link href="/shop" className="hover:text-ink">
              Shop
            </Link>{" "}
            / <span className="text-ink">{p.name}</span>
          </nav>
          <div className="flex items-center gap-2 text-sm">
            <Stars value={avg} />
            <span className="font-semibold">{avg.toFixed(1)}</span>
            <a href="#reviews" className="inline-flex min-h-11 items-center text-ink/70 underline underline-offset-2">
              ({p.reviews.length} review{p.reviews.length === 1 ? "" : "s"})
            </a>
          </div>
          <h1 className="display mt-4 text-[clamp(48px,5.4vw,88px)]">{p.name}</h1>
          <p className="mt-4 text-lg font-bold text-ink/80">{p.tagline}</p>

          <ul className="mt-5 space-y-2.5" aria-label="Key benefits">
            {p.benefits.map((b) => (
              <li key={b} className="flex items-start gap-3 text-base text-ink">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ink text-white">
                  <CheckIcon className="size-3.5" />
                </span>
                {b}
              </li>
            ))}
          </ul>

          <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-ink/75">{p.description}</p>

          <div className="mt-7 flex items-center gap-3">
            <span className="text-3xl font-black tracking-tight">{inr(p.price)}</span>
            <span className="text-lg text-ink/60 line-through">MRP {inr(p.mrp)}</span>
            <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">{discount(p)}% Off</span>
          </div>
          <p className="mt-1 text-sm text-ink/70">Inclusive of all taxes · {p.size}</p>

          <div id="buy-box" className="mt-7 grid grid-cols-[1fr_1.4fr] gap-2.5">
            <AddToCart slug={p.slug} />
            <AddToCart slug={p.slug} buyNow />
          </div>

          <DeliveryInfo className="mt-6" />

          <ul className="mt-6 grid grid-cols-3 gap-2 text-center text-[13px] font-medium text-ink/80">
            {[
              { Icon: LeafIcon, label: "Powered with Gooseberry" },
              { Icon: ShieldIcon, label: `${p.freeFrom[0].replace(/s$/, "")}-free` },
              { Icon: SparkIcon, label: "Made in India" },
            ].map(({ Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-2 rounded-[20px] bg-pale px-2 py-4">
                <Icon className="size-5" />
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/70">Best for</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {p.skinTypes.map((s) => (
                <span key={s} className="rounded-full border border-ink/20 px-3.5 py-1.5 text-sm">
                  {s} skin
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FormulaSpotlight product={p} />

      <StackedCards heading={`Why Choose ${p.name}?`} cards={p.why} image={p.image} backdrop={p.backdrop} />

      <HowItWorks heading="How To Use" steps={p.howToUse} backdrop={p.backdrop} />

      <Faq items={p.faqs} />

      <div id="reviews">
        <Reviews reviews={p.reviews} />
      </div>

      {/* COMPLETE THE ROUTINE */}
      <section className="bg-pale px-3 py-20 md:px-4 md:py-28">
        <h2 className="mb-10 text-center text-[clamp(24px,3vw,40px)] font-extrabold tracking-tight">
          Complete the <span className="text-mist">routine</span>
        </h2>
        <div className="mx-auto grid max-w-[1100px] gap-3 sm:grid-cols-2">
          {others.map((o) => (
            <Link
              key={o.slug}
              href={`/products/${o.slug}`}
              className="group relative flex aspect-[5/4] items-end overflow-hidden rounded-[32px] p-6 text-white md:rounded-[40px]"
              style={{ background: o.backdrop }}
            >
              <Image
                src={o.image}
                alt={altFor(o.image)}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover object-[50%_62%] transition-transform duration-[1.2s] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="relative flex w-full items-end justify-between gap-4">
                <div>
                  <p className="text-2xl font-extrabold leading-none">{o.name}</p>
                  <p className="mt-2 text-sm text-white/85">{o.tagline}</p>
                </div>
                <p className="shrink-0 font-bold">{inr(o.price)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Newsletter />
      {/* Keeps the last section clear of the docked mobile buy bar. */}
      <div aria-hidden className="h-24 md:hidden" />
      <StickyBuyBar slug={p.slug} name={p.name} price={p.price} mrp={p.mrp} image={p.image} backdrop={p.backdrop} />
    </>
  );
}
