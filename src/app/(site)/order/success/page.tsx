import type { Metadata } from "next";
import { OrderSuccess } from "./OrderSuccess";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export default function OrderSuccessPage() {
  return <OrderSuccess />;
}
