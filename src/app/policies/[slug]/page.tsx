import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { shippingInfo } from "@/lib/products";

type Section = { heading: string; points: string[] };

// Shipping & returns text is summarised from the client's current policy page.
// TODO: migrate the full Privacy and Terms text from elanmist.com before launch.
const policies: Record<string, { title: string; source: string; sections?: Section[] }> = {
  "shipping-and-returns": {
    title: "Shipping & Returns",
    source: "https://elanmist.com/shipping-and-returns-policy/",
    sections: [
      {
        heading: "Shipping",
        points: [
          "Free shipping on orders above ₹500. Orders below ₹500 have a ₹49 delivery fee, shown at checkout.",
          "Orders are processed within 1–2 business days. We don't process orders on Sundays or public holidays.",
          "Estimated delivery is 5–7 business days from dispatch. Remote areas may take longer.",
          "If your pincode isn't serviceable, the order is cancelled and fully refunded.",
        ],
      },
      {
        heading: "Payment",
        points: [
          "Orders on this website are prepaid through Razorpay: UPI, credit and debit cards, netbanking and wallets.",
          "Payments are processed securely by Razorpay. We never see or store your card details.",
        ],
      },
      {
        heading: "Returns",
        points: [
          "For hygiene and safety reasons, we don't accept returns for change of mind, skin incompatibility, or opened or used products.",
          "We only accept claims for damaged goods, incorrect products or verified manufacturing defects.",
          "Report the issue within 48 hours of delivery with an unboxing video showing the sealed package, shipping label and the full opening process.",
          "Elanmist may offer a replacement in place of a refund.",
        ],
      },
      {
        heading: "Refunds",
        points: [
          "Approved refunds are processed within 7–10 business days.",
          "Prepaid orders are refunded to the original payment method.",
        ],
      },
      {
        heading: "Contact",
        points: [
          `Email ${shippingInfo.support.email} or call ${shippingInfo.support.phone}. We acknowledge every complaint within 48 hours.`,
        ],
      },
    ],
  },
  privacy: { title: "Privacy Policy", source: "https://elanmist.com/privacy-policy/" },
  terms: { title: "Terms & Conditions", source: "https://elanmist.com/terms-and-conditions/" },
};

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  return { title: policies[slug]?.title };
}

export default async function PolicyPage(props: PageProps<"/policies/[slug]">) {
  const { slug } = await props.params;
  const policy = policies[slug];
  if (!policy) notFound();

  return (
    <section className="px-5 pb-24 pt-12 md:pt-20">
      <div className="mx-auto max-w-[760px]">
        <h1 className="display text-[clamp(40px,6vw,80px)]">{policy.title}</h1>

        {policy.sections ? (
          <div className="mt-10 space-y-4">
            {policy.sections.map((sec) => (
              <div key={sec.heading} className="rounded-[28px] bg-pale p-7 md:p-8">
                <h2 className="text-xl font-bold">{sec.heading}</h2>
                <ul className="mt-4 list-disc space-y-2.5 pl-5 text-base leading-relaxed text-ink/80">
                  {sec.points.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-[28px] bg-pale p-8 text-base leading-relaxed text-ink/75">
            Policy content is being migrated from the current site.
          </div>
        )}
      </div>
    </section>
  );
}
