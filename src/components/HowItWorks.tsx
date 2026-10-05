"use client";

import { useInView } from "./InView";

export function HowItWorks({
  heading,
  steps,
  backdrop,
}: {
  heading: string;
  steps: { title: string; body: string }[];
  backdrop: string;
}) {
  return (
    <section className="relative overflow-hidden bg-pale">
      <div
        aria-hidden
        className="absolute -right-40 top-1/2 size-[720px] -translate-y-1/2 rounded-full opacity-[0.12] blur-3xl"
        style={{ background: backdrop }}
      />
      <div className="relative mx-auto grid max-w-[1200px] gap-12 px-5 py-20 md:grid-cols-2 md:px-10 md:py-28">
        <h2 className="display text-[clamp(44px,6vw,88px)]">
          {heading.split(" ").map((w, i) => (
            <span key={i} className={`block ${i % 2 ? "text-mist" : ""}`}>
              {w}
            </span>
          ))}
        </h2>
        <ol className="flex flex-col gap-8">
          {steps.map((s, i) => (
            <Step key={s.title} n={i + 1} {...s} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  const { ref, inView } = useInView<HTMLLIElement>(0.4);
  return (
    <li ref={ref} className="flex gap-4">
      <span className="flex h-[38px] shrink-0 items-center rounded-full bg-ink px-3.5 font-mono text-sm text-white">
        {String(n).padStart(2, "0")}
      </span>
      <div>
        <h3
          className={`text-[22px] font-bold transition-all duration-[600ms] ease-[cubic-bezier(.4,0,.2,1)] ${
            inView ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
          }`}
        >
          {title}
        </h3>
        <p
          className={`mt-1 text-[15px] text-mist transition-all delay-150 duration-[600ms] ease-[cubic-bezier(.4,0,.2,1)] ${
            inView ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
          }`}
        >
          {body}
        </p>
      </div>
    </li>
  );
}
