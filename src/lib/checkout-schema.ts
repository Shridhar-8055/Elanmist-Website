import { z } from "zod";
import { MAX_QTY_PER_ITEM } from "./pricing";

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry",
  "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
] as const;

const trimmed = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} is required`)
    .max(max, `${label} is too long`);

export const customerSchema = z.object({
  name: trimmed(2, 80, "Full name"),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(120)),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")),
  address1: trimmed(5, 120, "Address"),
  address2: z.string().trim().max(120).optional().default(""),
  city: trimmed(2, 60, "City"),
  state: z.enum(INDIAN_STATES, { error: "Select your state" }),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode"),
});

export const createOrderSchema = z.object({
  customer: customerSchema,
  items: z
    .array(
      z.object({
        slug: z.string().min(1).max(60),
        qty: z.number().int().min(1).max(MAX_QTY_PER_ITEM),
      }),
    )
    .min(1, "Your cart is empty")
    .max(20),
  // Cloudflare Turnstile token; required on the server once Turnstile is configured.
  turnstileToken: z.string().max(4096).optional(),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().regex(/^order_[A-Za-z0-9]+$/),
  razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/),
});

export type Customer = z.infer<typeof customerSchema>;
export type CustomerInput = z.input<typeof customerSchema>;

/** Maps validation issues to { fieldName: firstMessage } for inline form errors. */
export function fieldErrors(issues: z.core.$ZodIssue[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path.at(-1) ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}
