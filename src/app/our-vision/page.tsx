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
