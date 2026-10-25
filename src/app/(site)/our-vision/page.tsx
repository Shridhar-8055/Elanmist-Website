import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { Reveal } from "@/components/InView";
import { Philosophy } from "@/components/Philosophy";
import { altFor } from "@/lib/imageAlt";

export const metadata: Metadata = { title: "Our Vision" };

const chapters = [
  {
    kicker: "Our Vision",
    image: "/images/shoot/trio-lineup.webp",
    fit: "contain",
    title: "Trusted skincare, made with intent.",
    body: "To be a trusted skincare provider that merges dermatological knowledge with modern beauty innovation — creating products with intent, knowledge, and respect for skin health.",
  },
  {
    kicker: "Our Commitment",
    image: "/images/shoot/sunscreen-cactus.webp",
    title: "Consistency over quick fixes.",
    body: "Carefully selected ingredients, thoughtful formulation, skin-friendly textures and consistent results. We believe in the power of sustained routines rather than overnight promises.",
  },
  {
    kicker: "Our Motivation",
    image: "/images/shoot/duo-tubes.webp",
    fit: "contain",
    title: "Skincare that doesn't overpromise.",
    body: "Too many products either overpromise or underperform. Elanmist exists to restore confidence through well-researched ingredients, balanced science and achievable outcomes — a reliable step toward healthier skin.",
  },
];

// CONFIRM: founder name, quotes and the ingredient promises with the client.
const founders = [
  {
    name: "Founder Name",
    role: "Founder",
    image: "/images/team/founder.webp",
    quote: "I wanted skincare I could explain to my own family — what's inside, and why it's there.",
  },
  {
    name: "Kiran BR",
    role: "Co-Founder",
    image: "/images/team/co-founder.webp",
    quote: "Good formulas deserve honest prices, and careful delivery to every corner of India.",
  },
];

const promises = [
  {
    title: "Pharmaceutical-grade actives",
    body: "Every ingredient comes from certified suppliers, with its certificate of analysis checked before it enters production.",
  },
  {
    title: "Used fresh, never stockpiled",
    body: "Raw materials are used well within their shelf life, so each active is at full strength when it reaches your skin.",
  },
  {
    title: "Small batches, each one tested",
    body: "We make in small runs and check every batch for stability and safety before it is packed.",
  },
  {
    title: "Only what earns its place",
    body: "No unnecessary fillers or harsh additives. If an ingredient doesn't help your skin, it isn't in the tube.",
  },
];

const agenda = [
  ["Accessible Luxury", "Premium formulations at honest prices.", "/images/shoot/sunscreen-tube-front.webp"],
  ["Transparent Ingredients", "Clear communication about what goes in, and why.", "/images/shoot/sunscreen-tube-box.webp"],
  ["Long-Term Skin Health", "Formulas that prioritise your barrier over quick results.", "/images/shoot/cream-tube-box.webp"],
  ["Simplicity", "Routines that fit modern lifestyles.", "/images/shoot/gel-jar-box.webp"],
];

export default function VisionPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-cocoa px-5 pb-24 pt-20 text-white md:pb-32 md:pt-28">
        <div className="absolute inset-y-0 right-0 w-full opacity-50 md:w-1/2 md:opacity-100">
          <Image src="/images/shoot/cream-rock.webp" alt={altFor("/images/shoot/cream-rock.webp")} fill preload sizes="50vw" className="photo-fade object-cover" />
        </div>
        <div className="relative mx-auto max-w-[1280px]">
          <p className="font-serif text-2xl italic text-white/85">The Elanmist Promise</p>
          <h1 className="display mt-4 max-w-[12ch] text-[clamp(52px,8vw,128px)] leading-[0.98]">Science, Balance, Consistency.</h1>
          <p className="mt-8 max-w-md text-[15px] leading-relaxed text-white/85">
            Science-guided skincare that builds growing confidence — transforming not just how skin looks, but how you
            feel in it.
          </p>
        </div>
      </section>

      <section className="bg-white px-4 py-20 md:py-28">
        <div className="mx-auto grid max-w-[1280px] gap-3 md:grid-cols-3">
          {chapters.map((c, i) => (
            <Reveal key={c.kicker} delay={i * 100}>
              <article className="group flex h-full flex-col rounded-[32px] bg-pale p-3 pb-8">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] bg-white">
                  <Image
                    src={c.image}
                    alt={altFor(c.image)}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    // Studio shots on white are shown whole; mood shots fill the frame.
                    className={`transition-transform duration-[1200ms] ease-out group-hover:scale-105 ${
                      c.fit === "contain" ? "object-contain p-4 pt-10" : "object-cover"
                    }`}
                  />
                  <p className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink backdrop-blur">
                    {c.kicker}
                  </p>
                </div>
                <h2 className="mt-7 px-5 text-[28px] font-bold leading-tight tracking-tight">{c.title}</h2>
                <p className="mt-4 px-5 text-sm leading-relaxed text-mist">{c.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Founders: arch portraits beside the ingredient promise they sign off on. */}
      <section className="relative overflow-hidden bg-wine px-4 py-20 text-white md:py-28">
        <span
          aria-hidden
          className="pointer-events-none absolute -left-40 top-1/3 size-[520px] rounded-full bg-[#e8a6b3] opacity-[0.07] blur-3xl"
        />
        {/* Mobile: heading, portraits, promises. Desktop: portraits left, text right. */}
        <div className="relative mx-auto grid max-w-[1280px] gap-12 lg:grid-cols-[1.05fr_1fr] lg:grid-rows-[auto_1fr] lg:gap-x-20 lg:gap-y-0">
          <div className="lg:col-start-2">
            <p className="font-serif text-2xl italic text-[#e8a6b3]">The people behind every batch</p>
            <h2 className="display mt-3 text-[clamp(40px,5.4vw,80px)] leading-[0.98]">Our Founders</h2>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-white/80 md:text-base">
              Elanmist began with a simple frustration: skincare that promised a lot and explained very little. So we
              built the brand we wanted to use ourselves, and we still sign off on every batch before it leaves.
            </p>
          </div>

          <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {founders.map((f, i) => (
                <Reveal key={f.role} delay={i * 140} className={i === 1 ? "mt-16 md:mt-24" : ""}>
                  <figure className="group">
                    {/* Rectangular portrait with an offset outline frame that slides into place on hover. */}
                    <div className="relative mr-3 mb-3 md:mr-4 md:mb-4">
                      <span
                        aria-hidden
                        className="absolute inset-0 translate-x-3 translate-y-3 rounded-md border border-[#e8a6b3]/60 transition-transform duration-700 ease-out group-hover:translate-x-0 group-hover:translate-y-0 md:translate-x-4 md:translate-y-4"
                      />
                      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-ink shadow-[0_24px_60px_rgb(0_0_0/0.45)]">
                        <Image
                          src={f.image}
                          alt={`${f.name}, ${f.role} of Elanmist`}
                          fill
                          sizes="(min-width: 1024px) 300px, 50vw"
                          className="object-cover object-top transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
                        />
                        <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
                        <span className="absolute left-3 top-3 font-serif text-lg italic text-white/90 md:left-4 md:top-4 md:text-xl">0{i + 1}</span>
                        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-wine md:bottom-4 md:left-4 md:text-[11px]">
                          {f.role}
                        </span>
                      </div>
                    </div>
                    <figcaption className="mt-6 md:mt-7">
                      <h3 className="text-xl font-bold tracking-tight md:text-2xl">{f.name}</h3>
                      <blockquote className="mt-3 border-l border-white/25 pl-3 font-serif text-[15px] italic leading-snug text-white/80 md:text-lg">
                        “{f.quote}”
                      </blockquote>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="lg:col-start-2 lg:pt-10">
            <ol className="border-t border-white/15">
              {promises.map((p, i) => (
                <li key={p.title} className="border-b border-white/15">
                  <Reveal delay={i * 90} className="grid grid-cols-[44px_1fr] gap-3 py-5">
                    <span className="font-serif text-xl italic text-white/50">0{i + 1}</span>
                    <span>
                      <span className="block text-[17px] font-semibold">{p.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-white/75">{p.body}</span>
                    </span>
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <Philosophy
        kicker="Our Philosophy"
        statement="Great skin comes from science, balance and"
        emphasis="consistency."
        pillars={[
          { title: "Clinical Actives", body: "Clinically recognised active ingredients, chosen for what they are proven to do.", tone: "#33364a", glow: "#9fb2f0", image: "/images/shoot/gel-slate.webp", focus: "50% 60%" },
          { title: "Barrier Protection", body: "Hydration and irritation reduction that keep your skin's barrier strong.", tone: "#37201f", glow: "#e9c3a8", image: "/images/shoot/cream-rock.webp", focus: "50% 50%" },
          { title: "Balanced Formulas", body: "Careful ingredient selection, without unnecessary additives.", tone: "#2c3527", glow: "#9cc28a", image: "/images/shoot/duo-monochrome.webp", focus: "50% 55%" },
          { title: "Honest Claims", body: "Dermatological awareness over exaggerated promises, and results you can actually expect.", tone: "#230a0e", glow: "#e8a6b3", image: "/images/shoot/sunscreen-stones-2.webp", focus: "50% 55%" },
        ]}
      />

      <section className="bg-mist px-4 py-20 text-white md:py-28">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="display text-[clamp(40px,6vw,96px)]">Our Agenda</h2>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {agenda.map(([t, b, img], i) => (
              <Reveal key={t} delay={i * 90}>
                <div className="group h-full rounded-[26px] bg-mist-deep p-2.5 pb-7">
                  <div className="relative aspect-square overflow-hidden rounded-[20px] bg-white">
                    <Image
                      src={img}
                      alt={altFor(img)}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                    />
                    <p className="absolute left-3 top-3 rounded-full bg-mist-deep/80 px-2.5 py-1 font-mono text-xs text-white backdrop-blur">
                      0{i + 1}
                    </p>
                  </div>
                  <h3 className="mt-6 px-4 text-xl font-bold">{t}</h3>
                  <p className="mt-2 px-4 text-sm text-white/85">{b}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Link
            href="/shop"
            className="mt-12 inline-flex h-[48px] items-center gap-2.5 rounded-full bg-white px-7 text-sm font-semibold text-ink"
          >
            Shop the range <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
