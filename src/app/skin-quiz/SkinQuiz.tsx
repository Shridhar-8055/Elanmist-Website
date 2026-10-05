"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AddToCart } from "@/components/CartButtons";
import { ArrowRight } from "@/components/icons";
import { getProduct, inr } from "@/lib/products";

// Questions mirror the current site's skin survey; answers map to a recommendation.
const steps = [
  {
    key: "type",
    q: "How does your skin usually feel?",
    options: [
      { label: "Tight & flaky", value: "dry" },
      { label: "Shiny by noon", value: "oily" },
      { label: "Oily T-zone, dry cheeks", value: "combination" },
      { label: "Easily irritated", value: "sensitive" },
    ],
  },
  {
    key: "concern",
    q: "What concern are you trying to solve?",
    options: [
      { label: "Dullness & uneven tone", value: "tone" },
      { label: "Dark spots", value: "spots" },
      { label: "Dehydration", value: "hydration" },
      { label: "Sun damage & tan", value: "sun" },
      { label: "Oiliness & acne", value: "oil" },
    ],
  },
  {
    key: "format",
    q: "Which type of solution do you prefer?",
    options: [
      { label: "Light gel", value: "gel" },
      { label: "Rich cream", value: "cream" },
      { label: "Daily sun protection", value: "spf" },
      { label: "Surprise me", value: "any" },
    ],
  },
] as const;

type Answers = Partial<Record<(typeof steps)[number]["key"], string>>;

function recommend(a: Answers) {
  const score: Record<string, number> = { "hybrid-sunscreen": 0, "glutathione-cream": 0, "hydroboost-gel": 0 };
  if (a.format === "spf") score["hybrid-sunscreen"] += 3;
  if (a.format === "cream") score["glutathione-cream"] += 3;
  if (a.format === "gel") score["hydroboost-gel"] += 3;
  if (a.concern === "sun") score["hybrid-sunscreen"] += 2;
  if (a.concern === "tone" || a.concern === "spots") score["glutathione-cream"] += 2;
  if (a.concern === "hydration") score["hydroboost-gel"] += 2;
  if (a.concern === "oil") {
    score["hydroboost-gel"] += 1;
    score["hybrid-sunscreen"] += 1;
  }
  if (a.type === "dry" || a.type === "sensitive") score["hydroboost-gel"] += 1;
  if (a.type === "combination") score["glutathione-cream"] += 1;
  if (a.type === "oily") score["hybrid-sunscreen"] += 1;
  const [best, second] = Object.entries(score).sort((x, y) => y[1] - x[1]);
  return [getProduct(best[0])!, getProduct(second[0])!];
}

export function SkinQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [contact, setContact] = useState({ name: "", email: "" });
  const [finished, setFinished] = useState(false);

  const total = steps.length + 1;

  if (finished) {
    const [p, alt] = recommend(answers);
    return (
      <section className="px-4 pb-20 pt-10 md:pt-16">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-center text-sm text-mist">
            {contact.name ? `${contact.name}, your` : "Your"} match
          </p>
          <div
            className="mt-6 grid overflow-hidden rounded-[36px] text-white md:grid-cols-2 md:rounded-[48px]"
            style={{ background: p.backdrop }}
          >
            <div className="relative aspect-[4/5] md:aspect-auto">
              <Image src={p.image} alt={p.name} fill sizes="50vw" className="photo-fade object-cover" />
            </div>
            <div className="flex flex-col justify-center p-7 md:p-14">
              <h1 className="display text-[clamp(44px,5vw,80px)]">{p.name}</h1>
              <p className="mt-4 font-bold text-white/80">{p.tagline}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/80">{p.description}</p>
              <p className="mt-6 text-2xl font-black">
                {inr(p.price)} <span className="text-base font-normal text-white/75 line-through">{inr(p.mrp)}</span>
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <AddToCart slug={p.slug} buyNow />
                <Link href={`/products/${p.slug}`} className="flex h-[52px] items-center rounded-full bg-white/15 px-6 text-[15px]">
                  View details
                </Link>
              </div>
              <p className="mt-8 text-sm text-white/80">
                Pairs well with{" "}
                <Link href={`/products/${alt.slug}`} className="font-semibold text-white underline underline-offset-4">
                  {alt.name}
                </Link>
                .
              </p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setFinished(false);
                setStep(0);
                setAnswers({});
              }}
              className="text-sm text-mist underline underline-offset-4"
            >
              Retake the quiz
            </button>
          </div>
        </div>
      </section>
    );
  }

  const current = steps[step];

  return (
    <section className="grid min-h-[calc(100svh-104px)] place-items-center px-5 py-16">
      <div className="w-full max-w-[720px] text-center">
        <div className="mx-auto mb-12 flex max-w-[320px] gap-1.5">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${i <= step ? "bg-ink" : "bg-pale-2"}`}
            />
          ))}
        </div>

        {current ? (
          <div key={current.key} className="animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-mist">
              Question {step + 1} of {steps.length}
            </p>
            <h1 className="mt-4 text-[clamp(28px,4vw,48px)] font-bold leading-tight tracking-tight">{current.q}</h1>
            <div className="mt-10 flex flex-wrap justify-center gap-2.5">
              {current.options.map((o) => {
                const selected = answers[current.key] === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      setAnswers((a) => ({ ...a, [current.key]: o.value }));
                      setTimeout(() => setStep((s) => s + 1), 220);
                    }}
                    className={`rounded-full px-6 py-3.5 text-[15px] transition-all duration-300 ${
                      selected ? "bg-ink text-white" : "bg-pale hover:bg-pale-2"
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <form
            className="animate-fade-up"
            onSubmit={(e) => {
              e.preventDefault();
              // TODO: send answers + contact to the client's CRM / email tool.
              setFinished(true);
            }}
          >
            <h1 className="text-[clamp(28px,4vw,48px)] font-bold leading-tight tracking-tight">Everyone has their own ritual ✨</h1>
            <p className="mt-10 text-[clamp(18px,2.2vw,24px)] leading-[2] text-mist">
              I&apos;m{" "}
              <input
                required
                value={contact.name}
                onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                placeholder="your name"
                aria-label="Your name"
                className="w-[150px] rounded-full bg-pale px-3 py-1.5 text-center text-ink outline-none placeholder:text-mist/50"
              />{" "}
              — send my routine to{" "}
              <input
                required
                type="email"
                value={contact.email}
                onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                placeholder="email address"
                aria-label="Email address"
                className="w-[210px] rounded-full bg-pale px-3 py-1.5 text-center text-ink outline-none placeholder:text-mist/50"
              />
            </p>
            <button type="submit" className="pill-dark mx-auto mt-12 flex h-[52px] items-center gap-2.5 rounded-full px-8 text-[15px]">
              Reveal my match <ArrowRight className="size-4" />
            </button>
          </form>
        )}

        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="mt-10 text-sm text-mist underline-offset-4 hover:underline">
            ← Back
          </button>
        )}
      </div>
    </section>
  );
}
