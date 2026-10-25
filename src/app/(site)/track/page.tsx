import type { Metadata } from "next";
import { TrackForm } from "./TrackForm";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the delivery status of your Elanmist order.",
};

export default async function TrackPage(props: PageProps<"/track">) {
  const { order } = await props.searchParams;
  return <TrackForm initialOrder={typeof order === "string" ? order : ""} />;
}
