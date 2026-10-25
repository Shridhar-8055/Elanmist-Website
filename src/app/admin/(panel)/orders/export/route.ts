import { isAdmin } from "@/lib/admin-auth";
import { getOrders } from "@/lib/admin-data";

// CSV download of orders for the admin (opens in Excel / Google Sheets).
export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const status = new URL(request.url).searchParams.get("status") ?? "";
  const { rows } = await getOrders(status, "", 5000, 0);

  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    // Quote everything; neutralise spreadsheet formulas in customer-typed text.
    return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
  };
  const header = ["Order no", "Created", "Paid at", "Status", "Name", "Mobile", "City", "Items", "Discount", "Total", "Shipment", "Courier", "AWB", "Code used"];
  const lines = rows.map((o) =>
    [o.order_no, o.created_at, o.paid_at, o.status, o.name, o.phone, o.city, o.items, o.discount, o.total, o.shipment_status, o.courier, o.awb, o.coupon_code_used ?? o.referral_code_used]
      .map(cell)
      .join(","),
  );
  const csv = "﻿" + [header.map(cell).join(","), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="elanmist-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
