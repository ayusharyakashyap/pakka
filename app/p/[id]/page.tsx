import type { Metadata } from "next";
import { getPlan } from "@/lib/store";
import PlanClient from "./PlanClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const plan = await getPlan(id);
  if (!plan) return { title: "Pakka" };
  const solo = plan.groupSize === 1;
  const title = solo
    ? `${plan.organizer} found their next solo weekend. Find yours.`
    : `${plan.organizer} wants to make "${plan.name}" actually happen`;
  return {
    title,
    description: solo
      ? "30 seconds. Your city, budget and vibe. Pakka picks the weekend and the place."
      : "Fill your 30-second card: city, budget, free weekends, vibe. Pakka picks where and when.",
    openGraph: { title, description: "Tap to fill your card. Takes 30 seconds." },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PlanClient id={id} />;
}
