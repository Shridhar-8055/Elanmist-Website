"use client";

import { useState } from "react";
import { ArrowRight } from "./icons";

const perks = [
  { title: "First to try", body: "Early access to new formulations before they launch." },
  { title: "Members-only offers", body: "Private pricing, reserved for the Circle." },
  { title: "Skin notes", body: "Short, honest guides from our formulation team." },
];

export function Newsletter() {
  const [done, setDone] = useState(false);

  return (
    <section className="bg-white px-4 py-20 md:py-28">
      <div className="relative mx-auto grid max-w-[1200px] overflow-hidden rounded-[36px] bg-pale md:grid-cols-[1.1fr_1fr] md:rounded-[48px]">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 size-[420px] rounded-full bg-[#e8a6b3] opacity-25 blur-3xl"
        />

        <div className="relative p-8 md:p-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mist">Newsletter</p>
          <h2 className="mt-4 font-serif text-[clamp(38px,4.4vw,60px)] leading-[1.02]">
            The Elanmist <em className="text-mist">Circle.</em>
          </h2>
          <ul className="mt-10 space-y-6">
            {perks.map((p, i) => (
              <li key={p.title} className="flex gap-4">
                <span className="w-6 shrink-0 font-serif text-lg italic text-mist-soft">0{i + 1}</span>
                <span>
                  <span className="block font-semibold">{p.title}</span>
                  <span className="mt-0.5 block text-sm text-mist">{p.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative m-2 flex flex-col justify-center rounded-[30px] bg-white p-7 md:m-3 md:rounded-[40px] md:p-12">
          {done ? (
            <div className="text-center">
              <p className="font-serif text-4xl">Welcome to the Circle.</p>
              <p className="mt-3 text-sm text-mist">Your first skin note is on its way.</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // TODO: connect to the client's email platform.
                setDone(true);
              }}
              className="space-y-4"
            >
              <p className="font-serif text-2xl leading-snug">Join for early access and members-only offers.</p>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-mist">First name</span>
                <input
                  required
                  name="name"
                  autoComplete="given-name"
                  className="h-[52px] w-full rounded-2xl border border-pale-2 bg-white px-5 text-[15px] outline-none transition-colors focus:border-ink"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-mist">Email address</span>
                <input
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
                  className="h-[52px] w-full rounded-2xl border border-pale-2 bg-white px-5 text-[15px] outline-none transition-colors focus:border-ink"
                />
              </label>
              <button
                type="submit"
                className="group flex h-[52px] w-full items-center justify-between rounded-2xl bg-ink px-6 text-[15px] font-medium text-white"
              >
                Join the Circle
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </button>
              <p className="text-xs text-mist">No spam. Unsubscribe anytime.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
