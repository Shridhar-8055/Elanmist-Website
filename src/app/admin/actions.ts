"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, signIn, signOut } from "@/lib/admin-auth";
import { createCoupon, deleteCoupon, setCouponActive, setReferralDisabled } from "@/lib/admin-data";

// Every action checks the admin session itself: rendering a form only on an admin
// page is not a security boundary.

export type FormState = { ok?: boolean; error?: string; message?: string } | null;

async function ip() {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const result = await signIn(String(form.get("password") ?? ""), await ip());
  if (result === "not_configured") return { error: "Admin login isn't set up yet: add ADMIN_PASSWORD and ADMIN_SESSION_SECRET in Vercel." };
  if (result === "blocked") return { error: "Too many wrong attempts. Wait 15 minutes and try again." };
  if (result === "wrong") return { error: "That password isn't right." };
  redirect("/admin");
}

export async function logoutAction() {
  await signOut();
  redirect("/admin/login");
}

// Times typed in the form are Indian time.
const istDate = z
  .string()
  .trim()
  .transform((v) => (v ? new Date(`${v}:00+05:30`).toISOString() : ""))
  .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Invalid date");

const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9]{4,20}$/, "Use 4–20 letters or numbers, no spaces")
      .refine((c) => !c.startsWith("ELAN"), "Codes starting with ELAN are reserved for referral codes"),
    description: z.string().trim().max(120).optional().default(""),
    kind: z.enum(["free_product", "percent", "flat", "free_shipping"], { error: "Choose what the coupon gives" }),
    value: z.coerce.number().int().min(0).max(100000).default(0),
    min_order: z.coerce.number().int().min(0).max(1000000).default(0),
    max_uses: z.string().trim().regex(/^\d*$/, "Whole number").optional().default(""),
    per_customer: z.coerce.number().int().min(1).max(100).default(1),
    who: z.enum(["everyone", "customer"]),
    assigned_name: z.string().trim().max(80).optional().default(""),
    assigned_email: z.string().trim().toLowerCase().max(120).optional().default(""),
    assigned_phone: z
      .string()
      .trim()
      .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
      .optional()
      .default(""),
    starts_at: istDate.optional().default(""),
    expires_at: istDate.optional().default(""),
  })
  .superRefine((c, ctx) => {
    if (c.kind === "percent" && (c.value < 1 || c.value > 100)) ctx.addIssue({ code: "custom", path: ["value"], message: "Enter a % between 1 and 100" });
    if (c.kind === "flat" && c.value < 1) ctx.addIssue({ code: "custom", path: ["value"], message: "Enter the ₹ amount off" });
    if (c.who === "customer") {
      if (!c.assigned_phone && !c.assigned_email) ctx.addIssue({ code: "custom", path: ["assigned_phone"], message: "Enter the customer's mobile or email" });
      if (c.assigned_phone && !/^[6-9]\d{9}$/.test(c.assigned_phone)) ctx.addIssue({ code: "custom", path: ["assigned_phone"], message: "Enter a 10-digit mobile number" });
      if (c.assigned_email && !z.email().safeParse(c.assigned_email).success) ctx.addIssue({ code: "custom", path: ["assigned_email"], message: "Enter a valid email" });
    }
    if (c.max_uses && Number(c.max_uses) < 1) ctx.addIssue({ code: "custom", path: ["max_uses"], message: "At least 1, or leave empty for no limit" });
    if (c.starts_at && c.expires_at && c.starts_at >= c.expires_at) ctx.addIssue({ code: "custom", path: ["expires_at"], message: "Must be after the start" });
  });

export async function createCouponAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = couponSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const c = parsed.data;
  const forCustomer = c.who === "customer";
  const result = await createCoupon({
    code: c.code,
    description: c.description,
    kind: c.kind,
    value: c.kind === "percent" || c.kind === "flat" ? c.value : 0,
    min_order: c.min_order,
    max_uses: c.max_uses,
    per_customer: c.per_customer,
    assigned_name: forCustomer ? c.assigned_name : "",
    assigned_email: forCustomer ? c.assigned_email : "",
    assigned_phone: forCustomer ? c.assigned_phone : "",
    starts_at: c.starts_at,
    expires_at: c.expires_at,
  });
  if (result === "exists") return { error: `A coupon called ${c.code} already exists.` };
  if (result !== "ok") return { error: "That coupon couldn't be saved. Check the values." };
  revalidatePath("/admin/coupons");
  return { ok: true, message: `Coupon ${c.code} created.` };
}

const codeField = z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4,20}$/);

export async function toggleCouponAction(form: FormData) {
  await requireAdmin();
  const code = codeField.parse(form.get("code"));
  await setCouponActive(code, form.get("active") === "true");
  revalidatePath("/admin/coupons");
}

export async function deleteCouponAction(form: FormData) {
  await requireAdmin();
  const code = codeField.parse(form.get("code"));
  await deleteCoupon(code);
  revalidatePath("/admin/coupons");
}

export async function toggleReferralAction(form: FormData) {
  await requireAdmin();
  const code = codeField.parse(form.get("code"));
  await setReferralDisabled(code, form.get("disabled") === "true");
  revalidatePath("/admin/referrals");
}
