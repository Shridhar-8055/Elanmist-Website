"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { INDIAN_STATES } from "@/lib/checkout-schema";
import { currentCustomer, supabaseServer } from "@/lib/supabase/server";

export type AddressState = { ok?: boolean; error?: string } | null;

const addressSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")),
  address1: z.string().trim().min(5, "Enter your house no. and street").max(120),
  address2: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().min(2, "Enter your city").max(60),
  state: z.enum(INDIAN_STATES, { error: "Choose your state" }),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode"),
});

export async function saveAddressAction(_prev: AddressState, form: FormData): Promise<AddressState> {
  const me = await currentCustomer();
  if (!me) redirect("/login?next=/account");
  const parsed = addressSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the address." };
  // Row Level Security only lets a customer update their own row.
  const { error } = await me.supabase.from("customers").update(parsed.data).eq("id", me.user.id);
  if (error) {
    console.error("[account] address save failed", error.message);
    return { error: "We couldn't save your address. Please try again." };
  }
  revalidatePath("/account");
  return { ok: true };
}

export async function signOutAction() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}
