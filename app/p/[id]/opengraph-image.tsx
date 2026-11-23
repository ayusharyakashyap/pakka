import { ImageResponse } from "next/og";
import { getMembers, getPlan } from "@/lib/store";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await getPlan(id);
  const members = plan ? await getMembers(id) : [];
  const solo = plan?.groupSize === 1;
  const line = !plan
    ? "Make it pakka."
    : solo
    ? "Found my next solo weekend."
    : `${members.length}/${plan.groupSize} friends have filled their card`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FFF8EE", padding: 64, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 44, fontWeight: 800 }}>pakka<span style={{ color: "#FF5A36" }}>.</span></div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 70, fontWeight: 800, lineHeight: 1.05, color: "#14110F" }}>
            {plan ? (solo ? `${plan.organizer}'s solo escape` : plan.name) : "The trip that actually happens"}
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 38, color: "#14110F", background: "#FFC83D", border: "4px solid #14110F", borderRadius: 18, padding: "12px 24px", alignSelf: "flex-start" }}>
            {line}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#555" }}>Tap to fill your card. 30 seconds. No sign-up.</div>
      </div>
    ),
    size
  );
}
