"use client";

// Browser-side helpers for Razorpay Checkout (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/).

export type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type RazorpayFailure = {
  error: { code: string; description: string; reason?: string; metadata?: { order_id?: string; payment_id?: string } };
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  image?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  retry?: { enabled: boolean; max_count?: number };
  modal?: { ondismiss?: () => void; confirm_close?: boolean; escape?: boolean };
  handler: (response: RazorpaySuccess) => void;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", cb: (response: RazorpayFailure) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let loading: Promise<void> | null = null;

/** Loads checkout.js once, on demand, so it never slows down the rest of the site. */
export function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Not in a browser"));
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("Couldn't load the payment window. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });
  return loading;
}

export function openRazorpay(options: RazorpayOptions, onFailed: (r: RazorpayFailure) => void) {
  if (!window.Razorpay) throw new Error("Razorpay is not loaded");
  const rzp = new window.Razorpay(options);
  rzp.on("payment.failed", onFailed);
  rzp.open();
}

/** sessionStorage key holding the last confirmed order, read by /order/success. */
export const LAST_ORDER_KEY = "elanmist-last-order";

export type LastOrder = {
  receipt: string;
  paymentId: string;
  totals: { lines: { slug: string; name: string; qty: number; lineTotal: number }[]; subtotal: number; shipping: number; total: number };
  customer: { name: string; email: string; phone: string; city: string };
};
