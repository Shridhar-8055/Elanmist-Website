import "server-only";
import { rpc } from "./supabase-admin";

// Read/manage helpers for the admin dashboard. All run with the server's secret key;
// callers must have passed requireAdmin() first.

export type OrderStatus = "awaiting_payment" | "payment_setup_failed" | "paid" | "payment_failed" | "refunded" | "cancelled";

export type Overview = {
  days: number;
  revenue: number;
  orders: number;
  avg_order: number;
  discount_given: number;
  today_revenue: number;
  today_orders: number;
  all_time_revenue: number;
  all_time_orders: number;
  customers: number;
  abandoned: number;
  to_dispatch: number;
  needs_attention: number;
  delivered: number;
  in_transit: number;
  daily: { day: string; revenue: number; orders: number }[];
  top_products: { slug: string; name: string; units: number; revenue: number }[];
  referrals: { issued: number; used: number; used_in_range: number };
  coupons: { active: number; used: number; used_in_range: number };
  recent: { order_no: string; name: string; city: string; total: number; status: OrderStatus; shipment_status: string | null; created_at: string }[];
};

export type OrderRow = {
  order_no: string;
  name: string;
  phone: string;
  city: string;
  total: number;
  discount: number;
  status: OrderStatus;
  shipment_status: string | null;
  courier: string | null;
  awb: string | null;
  referral_code_used: string | null;
  coupon_code_used: string | null;
  created_at: string;
  paid_at: string | null;
  items: string | null;
};

export type OrderDetail = {
  order: OrderRow & {
    email: string;
    address1: string;
    address2: string | null;
    state: string;
    pincode: string;
    subtotal: number;
    shipping: number;
    razorpay_order_id: string | null;
    payment_id: string | null;
    payment_method: string | null;
    shiprocket_order_id: string | null;
    tracking_url: string | null;
    own_referral_code: string | null;
    notes: string | null;
    updated_at: string;
  };
  items: { slug: string; name: string; qty: number; unit_price: number; line_total: number }[];
  previous_orders: number;
};

export type CustomerRow = {
  phone: string;
  name: string;
  email: string;
  city: string;
  orders: number;
  spent: number;
  unpaid_attempts: number;
  first_seen: string;
  last_seen: string;
};

export type Coupon = {
  code: string;
  description: string | null;
  kind: "free_product" | "percent" | "flat" | "free_shipping";
  value: number;
  min_order: number;
  max_uses: number | null;
  per_customer: number;
  assigned_name: string | null;
  assigned_email: string | null;
  assigned_phone: string | null;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  used: number;
  in_checkout: number;
  redemptions: { order_no: string; phone: string; email: string; used_at: string }[];
};

export type ReferralRow = {
  code: string;
  owner_order_no: string;
  owner_name: string | null;
  owner_phone: string;
  owner_email: string;
  status: "active" | "reserved" | "used" | "disabled";
  used_order_no: string | null;
  used_by_name: string | null;
  used_at: string | null;
  created_at: string;
};

type Page<T> = { total: number; rows: T[] };

export const getOverview = (days: number) => rpc<Overview>("admin_overview", { p_days: days });
export const getOrders = (status: string, search: string, limit: number, offset: number) =>
  rpc<Page<OrderRow>>("admin_orders", { p_status: status || null, p_search: search || null, p_limit: limit, p_offset: offset });
export const getOrder = (orderNo: string) => rpc<OrderDetail | null>("admin_order", { p_order_no: orderNo });
export const getCustomers = (search: string, limit: number, offset: number) =>
  rpc<Page<CustomerRow>>("admin_customers", { p_search: search || null, p_limit: limit, p_offset: offset });
export const getCoupons = () => rpc<Coupon[]>("admin_coupons", {});
export const getReferrals = (status: string, search: string, limit: number, offset: number) =>
  rpc<Page<ReferralRow>>("admin_referrals", { p_status: status || null, p_search: search || null, p_limit: limit, p_offset: offset });

export const createCoupon = (p: Record<string, unknown>) => rpc<"ok" | "exists" | "invalid">("admin_create_coupon", { p });
export const setCouponActive = (code: string, active: boolean) => rpc<null>("admin_set_coupon_active", { p_code: code, p_active: active });
export const deleteCoupon = (code: string) => rpc<"ok" | "has_uses">("admin_delete_coupon", { p_code: code });
export const setReferralDisabled = (code: string, disabled: boolean) =>
  rpc<"ok" | "used" | "invalid">("admin_set_referral_disabled", { p_code: code, p_disabled: disabled });
