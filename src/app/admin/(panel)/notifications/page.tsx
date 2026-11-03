import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminNotifications } from "@/lib/admin-notifications";
import { supabaseConfigured } from "@/lib/supabase-admin";
import { NotConnected, PageHeader } from "../../ui";
import { NotificationList } from "./NotificationList";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  await requireAdmin();
  if (!supabaseConfigured()) return <NotConnected />;
  const items = await getAdminNotifications(100);
  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="New orders, shipments that need you, failed payments and checkouts left unpaid. The bell checks for new ones every 30 seconds."
      />
      <NotificationList items={items} />
    </>
  );
}
