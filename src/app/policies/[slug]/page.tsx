import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { policies } from "@/lib/policies";

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  return { title: policies[slug]?.title };
}

const links = [
  { slug: "shipping-and-returns", label: "Shipping & Refunds" },
  { slug: "privacy", label: "Privacy" },
  { slug: "terms", label: "Terms" },
];

export default async function PolicyPage(props: PageProps<"/policies/[slug]">) {
  const { slug } = await props.params;
  const policy = policies[slug];
  if (!policy) notFound();

  return (
    <section className="px-5 pb-24 pt-12 md:pt-20">
      <div className="mx-auto max-w-[780px]">
        <nav aria-label="Policies" className="mb-8 flex flex-wrap gap-2">
          {links.map((l) => (
            <Link
              key={l.slug}
              href={`/policies/${l.slug}`}
              aria-current={l.slug === slug ? "page" : undefined}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold ${
                l.slug === slug ? "bg-ink text-white" : "bg-pale text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <h1 className="text-[clamp(32px,4.6vw,56px)] font-extrabold leading-tight tracking-tight">{policy.title}</h1>
        {policy.updated && <p className="mt-3 text-sm text-ink/70">{policy.updated}</p>}

        {policy.intro && (
          <div className="mt-6 space-y-3 text-base leading-relaxed text-ink/80">
            {policy.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        )}

        <div className="mt-10 space-y-7">
          {policy.sections.map((sec, i) => (
            <div key={`${sec.heading}-${i}`}>
              {sec.heading && <h2 className="text-xl font-bold">{sec.heading}</h2>}
              {sec.body?.map((p) => (
                <p key={p} className="mt-2 text-base leading-relaxed text-ink/80">
                  {p}
                </p>
              ))}
              {sec.points && (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-ink/80">
                  {sec.points.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
