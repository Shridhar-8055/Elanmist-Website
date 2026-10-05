import Image from "next/image";
import Link from "next/link";
import { BuyButton, QuickAdd } from "@/components/CartButtons";
import { ArrowRight, ArrowUpRight, CheckIcon } from "@/components/icons";
import { Reveal } from "@/components/InView";
import { Newsletter } from "@/components/Newsletter";
import { Philosophy } from "@/components/Philosophy";
import { discount, inr, products, skinTypes } from "@/lib/products";
import { altFor } from "@/lib/imageAlt";

const keyIngredients = [
  { n: "01", name: "Indian Gooseberry", kind: "Amla Extract", image: "/images/shoot/trio-group.webp", body: "Rich in Vitamin C, this powerful antioxidant brightens skin and fights signs of aging naturally.", swatch: "#9cc28a" },
  { n: "02", name: "Niacinamide", kind: "Vitamin B3", image: "/images/shoot/gel-box.webp", body: "Strengthens the skin barrier, minimizes pores, and evens out skin tone for a smooth, refined complexion.", swatch: "#c9b7d9" },
  { n: "03", name: "Hyaluronic Acid", kind: "HA Complex", image: "/images/shoot/gel-jar.webp", body: "Holds up to 1000x its weight in water, providing deep hydration and plumping skin from within.", swatch: "#9fb2f0" },
  { n: "04", name: "Glutathione", kind: "Master Antioxidant", image: "/images/shoot/cream-box.webp", body: "Reduces oxidative stress and promotes a luminous, even-looking skin tone.", swatch: "#e9c3a8" },
];

export default function Home() {
  const hero = products[0];

  return (
    <>
      {/* HERO — full-bleed, product photo melting into its backdrop, copy on the right. */}
      <section className="relative h-[calc(100svh-36px)] min-h-[620px] overflow-hidden" style={{ background: hero.backdrop }}>
        <div className="absolute bottom-0 left-1/2 top-[34%] w-[120%] -translate-x-1/2 md:inset-y-0 md:left-[4%] md:w-[58%] md:translate-x-0">
          <Image
            src={hero.image}
            alt={hero.imageAlt}
            fill
            preload
            sizes="(min-width: 768px) 58vw, 120vw"
            className="photo-fade object-cover object-[50%_60%]"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/55 md:bg-gradient-to-r md:from-transparent md:via-black/15 md:to-black/60" />
        <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-between px-6 pb-14 pt-28 text-center text-white md:flex-row md:items-center md:justify-end md:px-[8vw] md:pb-0 md:pt-0 md:text-left">
          <div className="animate-fade-up md:max-w-[520px]">
            <p className="font-serif text-[clamp(20px,1.6vw,26px)] italic text-white/90">Imagined with nature, proven by science</p>
            <h1 className="display mt-3 text-[clamp(46px,5.4vw,84px)] [text-shadow:0_4px_40px_rgb(0_0_0/0.35)]">
              Embrace Your Natural Radiance
            </h1>
            <p className="mt-5 hidden max-w-[40ch] text-[17px] text-white/90 md:block">
              Science-backed formulas with natural ingredients for luminous, healthy skin.
            </p>
            <Link
              href="/shop"
              className="mt-10 hidden h-[52px] items-center gap-2.5 rounded-full bg-white px-8 text-base font-semibold text-ink transition-transform hover:scale-[1.03] md:inline-flex"
            >
              Shop the range <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="animate-fade-up md:hidden" style={{ animationDelay: "200ms" }}>
            <Link href="/shop" className="inline-flex h-[52px] items-center gap-2.5 rounded-full bg-white px-8 text-base font-semibold text-ink">
              Shop the range <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-white/80 md:block">
          Scroll
        </div>
      </section>

      {/* PRODUCT PANELS — sticky full-height stack, one per product. */}
      <section aria-label="Products">
        {products.map((p, i) => (
          <article
            key={p.slug}
            className="sticky top-0 h-svh min-h-[640px] overflow-hidden rounded-t-[36px] text-white shadow-[0_-20px_60px_rgb(0_0_0/0.25)] md:rounded-t-[48px]"
            style={{ background: p.backdrop }}
          >
            <div className="mx-auto grid h-full max-w-[1440px] grid-rows-[1fr_auto] md:grid-cols-2 md:grid-rows-1">
              <div className="relative">
                <Image
                  src={p.image}
                  alt={p.imageAlt}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="photo-fade object-cover object-center"
                />
              </div>
              <div className="relative flex flex-col justify-center px-6 pb-10 md:px-[6vw] md:pb-0">
                <p className="mb-4 font-mono text-xs text-white/75 md:mb-5">
                  {String(i + 1).padStart(2, "0")} / {String(products.length).padStart(2, "0")}
                </p>
                <h2 className="display text-[clamp(44px,6.2vw,104px)]">
                  {p.name.split(" ").map((w, j) => (
                    <span key={j} className="block">
                      {w}
                    </span>
                  ))}
                </h2>
                <p className="mt-4 text-lg font-bold text-white md:mt-5">{p.tagline}</p>
                <ul className="mt-4 space-y-2">
                  {p.benefits.map((b, j) => (
                    <li key={b} className={`flex items-start gap-2.5 text-[15px] text-white/90 ${j > 1 ? "max-md:hidden" : ""}`}>
                      <CheckIcon className="mt-0.5 size-5 shrink-0" style={{ color: p.accent }} />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="text-2xl font-black">{inr(p.price)}</span>
                  <span className="text-base text-white/75 line-through">MRP {inr(p.mrp)}</span>
                  <span className="rounded-full px-2.5 py-1 text-xs font-bold text-ink" style={{ background: p.accent }}>
                    {discount(p)}% OFF
                  </span>
                </div>
                <div className="mt-5 flex items-center gap-2.5">
                  <BuyButton slug={p.slug} label={`View ${p.shortName}`} tone="onDark" />
                  <QuickAdd slug={p.slug} />
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      <Philosophy
        kicker="Our Philosophy"
        statement="Skincare rooted in purpose,"
        emphasis="not trends."
        pillars={[
          { title: "Natural First", body: "Every formulation starts with nature's most potent botanicals, like Indian Gooseberry, carefully sourced for purity.", tone: "#2c3527", glow: "#9cc28a", image: "/images/shoot/sunscreen-cactus.webp", focus: "30% 50%" },
          { title: "Science-Driven", body: "Advanced dermatological research meets traditional wisdom in every product we create.", tone: "#33364a", glow: "#9fb2f0", image: "/images/shoot/gel-window-light.webp", focus: "50% 60%" },
          { title: "Skin-Kind", body: "Free from harsh chemicals. Gentle formulas that respect your skin's natural balance.", tone: "#230a0e", glow: "#e8a6b3", image: "/images/shoot/sunscreen-table.webp", focus: "50% 45%" },
          { title: "Barrier Care", body: "Strengthening your skin's protective barrier for lasting health and resilience.", tone: "#37201f", glow: "#e9c3a8", image: "/images/shoot/gel-vase.webp", focus: "60% 60%" },
        ]}
      />

      {/* KEY INGREDIENTS */}
      <section className="bg-pale px-4 py-20 md:py-28">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-12 flex flex-col items-start justify-between gap-6 md:mb-16 md:flex-row md:items-end">
            <h2 className="display text-[clamp(40px,5.6vw,84px)]">
              Key <span className="text-mist">Ingredients</span>
            </h2>
            <p className="max-w-sm text-[15px] text-mist">
              Nature&apos;s most effective elements, carefully selected for your skin&apos;s well-being.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {keyIngredients.map((k, i) => (
              <Reveal key={k.n} delay={i * 90}>
                <article className="group flex h-full flex-col rounded-[32px] bg-white p-3 pb-7 transition-transform duration-500 ease-out hover:-translate-y-1.5">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-white">
                    <Image
                      src={k.image}
                      alt={altFor(k.image)}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-contain p-3 transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-white/85 px-2.5 py-1 font-mono text-xs text-mist backdrop-blur">
                      {k.n}
                    </span>
                    <span
                      className="absolute bottom-3 right-3 size-11 rounded-full ring-4 ring-white transition-transform duration-700 ease-bouncy group-hover:scale-110"
                      style={{ background: `radial-gradient(circle at 30% 30%, #fff8, transparent 60%), ${k.swatch}` }}
                    />
                  </div>
                  <h3 className="mt-6 px-4 text-[26px] font-bold leading-tight tracking-tight">{k.name}</h3>
                  <p className="mt-1 px-4 text-xs font-semibold uppercase tracking-[0.1em] text-mist">{k.kind}</p>
                  <p className="mt-4 px-4 text-sm leading-relaxed text-mist">{k.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SKIN TYPE MATCHER */}
      <section className="bg-white px-4 py-20 md:py-28">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-12 text-center md:mb-16">
            <h2 className="text-[clamp(28px,4vw,54px)] font-extrabold leading-none tracking-tight">
              Find Your Perfect Match. <span className="text-mist">Every skin, sorted.</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {skinTypes.map((s, i) => {
              const p = products.find((x) => x.slug === s.product)!;
              return (
                <Reveal key={s.key} delay={i * 90}>
                  <Link
                    href={`/products/${p.slug}`}
                    className="group relative block aspect-[3/4] overflow-hidden rounded-[28px] bg-pale text-white md:rounded-[40px]"
                  >
                    <Image
                      src={s.image}
                      alt={altFor(s.image)}
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/10 to-black/40" />
                    <div className="absolute inset-x-0 top-0 p-5 text-center md:p-7">
                      <h3 className="text-[clamp(20px,2vw,30px)] font-extrabold leading-none [text-shadow:0_1px_10px_rgb(0_0_0/0.45)]">{s.label}</h3>
                      <p className="mx-auto mt-2 max-w-[24ch] text-sm text-white/95 [text-shadow:0_1px_8px_rgb(0_0_0/0.5)]">{s.feel}</p>
                    </div>
                    <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-full bg-white py-1.5 pl-4 pr-1.5 text-ink md:inset-x-5 md:bottom-5">
                      <span className="min-w-0 leading-tight">
                        <span className="block truncate text-[13px] font-semibold md:text-sm">{p.name}</span>
                        <span className="block text-[13px] font-bold md:text-sm">{inr(p.price)}</span>
                      </span>
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-white transition-transform group-hover:rotate-45">
                        <ArrowUpRight className="size-4" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <Link href="/skin-quiz" className="pill-dark inline-flex h-[46px] items-center gap-2.5 rounded-full px-7 text-[13px]">
              Not sure? Take the skin quiz <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* SCIENCE STRIP */}
      <section className="bg-ink px-4 py-20 text-white md:py-28">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="display max-w-[14ch] text-[clamp(40px,6vw,96px)]">
            Science-Based <span className="text-mist-soft/60">Skincare</span>
          </h2>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/80">
            Every Elanmist product is formulated with dermatologically tested ingredients, backed by research and designed
            to deliver visible results.
          </p>
          <div className="mt-14 grid gap-3 md:grid-cols-3">
            {[
              ["Clinically Formulated", "Developed with dermatologists for optimal efficacy.", "/images/shoot/duo-monochrome.webp"],
              ["Research-Backed", "Ingredients proven through scientific studies.", "/images/shoot/gel-window-light.webp"],
              ["Quality Assured", "Rigorous testing for safety and performance.", "/images/shoot/sunscreen-stones-2.webp"],
            ].map(([t, b, img], i) => (
              <Reveal key={t} delay={i * 90}>
                <div className="group overflow-hidden rounded-[28px] bg-white/[0.06] ring-1 ring-white/10">
                  <div className="relative aspect-[5/4] overflow-hidden">
                    <Image
                      src={img}
                      alt={altFor(img)}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover grayscale transition-[filter,transform] duration-[1200ms] ease-out group-hover:scale-105 group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
                    <p className="absolute left-6 top-5 font-mono text-xs text-white/85">0{i + 1}</p>
                  </div>
                  <div className="px-7 pb-7">
                    <h3 className="text-xl font-bold">{t}</h3>
                    <p className="mt-2 text-sm text-white/80">{b}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="bg-pale px-5 py-24 text-center md:py-32">
        <Reveal className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mist">What our customers say</p>
          <blockquote className="mt-8 font-serif text-[clamp(28px,3.6vw,48px)] leading-[1.15]">
            “As someone with sensitive skin, finding products that work without irritation is hard. This gel is perfect.”
          </blockquote>
          <p className="mt-8 text-sm font-semibold">Sneha D. · HydroBoost Gel</p>
        </Reveal>
      </section>

      {/* RESEARCH CTA */}
      <section className="bg-white px-4 pt-20 md:pt-28">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-8 rounded-[36px] bg-mist px-7 py-12 text-white md:flex-row md:items-center md:rounded-[48px] md:px-14 md:py-16">
          <div>
            <h2 className="display text-[clamp(34px,4.4vw,64px)]">Help Us Build What Comes Next</h2>
            <p className="mt-4 max-w-lg text-[15px] text-white/75">
              We&apos;re currently researching our next formulation. Your skin concerns, habits and needs help us create
              something truly effective.
            </p>
          </div>
          <Link
            href="/skin-quiz"
            className="inline-flex h-[50px] shrink-0 items-center gap-2.5 rounded-full bg-white px-7 text-sm font-semibold text-ink"
          >
            Share Your Skin Insights <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <Newsletter />
    </>
  );
}
