import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, TruckIcon } from "@/components/icons";
import { inr } from "@/lib/products";
import { currentCustomer } from "@/lib/supabase/server";
import { signOutAction } from "./actions";
import { AddressForm, type SavedAddress } from "./AddressForm";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

type AccountOrder = {
  order_no: string;
  status: "paid" | "refunded";
  total: number;
  discount: number;
  created_at: string;
  shipment_status: string | null;
  courier: string | null;
  awb: string | null;
  tracking_url: string | null;
  order_items: { name: string; qty: number }[];
};

const date = (v: string) =>
  new Date(v).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });

function deliveryLabel(o: AccountOrder) {
  if (o.status === "refunded") return { text: "Refunded", tone: "bg-slate-100 text-slate-700" };
  const s = o.shipment_status ?? "";
  if (/delivered/i.test(s)) return { text: "Delivered", tone: "bg-emerald-50 text-emerald-800" };
  if (o.awb) return { text: s || "Shipped", tone: "bg-sky-50 text-sky-800" };
  return { text: "Preparing to ship", tone: "bg-amber-50 text-amber-800" };
}

export default async function AccountPage() {
  const me = await currentCustomer();
  if (!me) redirect("/login?next=/account");
  const { supabase, user } = me;

  // Row Level Security returns only this customer's rows (linked by account, email or mobile).
  const [{ data: orders }, { data: profile }] = await Promise.all([
    supabase
      .from("orders")
      .select("order_no,status,total,discount,created_at,shipment_status,courier,awb,tracking_url,order_items(name,qty)")
      .in("status", ["paid", "refunded"])
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<AccountOrder[]>(),
    supabase.from("customers").select("name,phone,address1,address2,city,state,pincode").eq("id", user.id).maybeSingle<SavedAddress>(),
  ]);

  const firstName = (profile?.name ?? "").split(" ")[0];

  return (
    <section className="px-4 pb-24 pt-8 md:pt-12">
      <div className="mx-auto max-w-[1160px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mist">My account</p>
            <h1 className="mt-2 text-[clamp(30px,4vw,48px)] font-extrabold leading-tight tracking-tight">
              {firstName ? `Hello, ${firstName}` : "Welcome back"}
            </h1>
            <p className="mt-1 break-all text-base text-ink/65">{user.email}</p>
          </div>
          <form action={signOutAction}>
            <button type="submit" className="h-11 rounded-full border-2 border-ink px-5 text-sm font-semibold hover:bg-ink hover:text-white">
              Log out
            </button>
          </form>
        </div>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.5fr_1fr] [&>*]:min-w-0">
          <div>
            <h2 className="text-lg font-bold">Your orders</h2>
            {orders?.length ? (
              <ul className="mt-4 space-y-3">
                {orders.map((o) => {
                  const d = deliveryLabel(o);
                  return (
                    <li key={o.order_no} className="rounded-[24px] border border-ink/10 bg-white p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-semibold">{o.order_no}</p>
                          <p className="text-sm text-ink/60">{date(o.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold tabular-nums">{inr(o.total)}</p>
                          {o.discount > 0 && <p className="text-xs text-ink/55">saved {inr(o.discount)}</p>}
                        </div>
                      </div>
                      <p className="mt-3 text-[15px] text-ink/80">
                        {o.order_items.map((i) => `${i.name} × ${i.qty}`).join(", ") || "—"}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/5 pt-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${d.tone}`}>
                          <TruckIcon className="size-4" /> {d.text}
                          {o.courier && <span className="font-normal opacity-75">· {o.courier}</span>}
                        </span>
                        <Link
                          href={`/track?order=${encodeURIComponent(o.order_no)}`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4"
                        >
                          Track order <ArrowRight className="size-4" />
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-4 rounded-[24px] bg-pale p-6 text-center">
                <p className="font-semibold">No orders yet</p>
                <p className="mt-1 text-sm text-ink/65">
                  Orders you place with {user.email} appear here, including ones placed before you made an account.
                </p>
                <Link href="/shop" className="pill-dark mt-5 inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold">
                  Shop the range <ArrowRight className="size-4" />
                </Link>
              </div>
            )}
          </div>

          <aside className="rounded-[28px] bg-pale p-5 md:p-7 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold">Saved address</h2>
            <p className="mt-1 text-sm text-ink/65">Used to fill in checkout for you next time.</p>
            <AddressForm saved={profile ?? null} />
          </aside>
        </div>
      </div>
    </section>
  );
}
