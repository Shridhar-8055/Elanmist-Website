"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "../actions";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/referrals", label: "Referral codes" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="overflow-x-auto px-2 pb-2 lg:px-3">
      <ul className="flex gap-1 lg:flex-col">
        {links.map((l) => {
          const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-colors ${
                  active ? "bg-white text-ink" : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
        <li className="lg:mt-4 lg:border-t lg:border-white/10 lg:pt-4">
          <Link href="/" className="block whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[15px] text-white/60 hover:text-white">
            View shop ↗
          </Link>
        </li>
        <li className="hidden lg:block">
          <form action={logoutAction}>
            <button type="submit" className="w-full rounded-xl px-3.5 py-2.5 text-left text-[15px] text-white/60 hover:bg-white/10 hover:text-white">
              Sign out
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
