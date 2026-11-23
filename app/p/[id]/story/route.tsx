import { ImageResponse } from "next/og";
import { fullPlan } from "@/lib/api";
import { destById } from "@/lib/data";

// 1080x1920 Instagram story card for a plan's top pick / locked trip.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await fullPlan(id);
  if (!data) return new Response("Not found", { status: 404 });
  const { plan, results, members } = data;
  const destId = plan.locked?.destId ?? results.ranking[0]?.destId;
  const dest = destById(destId ?? "");
  const wk = plan.weekends.find((w) => w.id === (plan.locked?.weekendId ?? results.bestWeekendId));
  const solo = plan.groupSize === 1;
  const origin = new URL(req.url).origin;
  const headline = plan.locked ? "IT'S PAKKA." : solo ? "MY NEXT SOLO WEEKEND" : `PAKKA METER: ${results.pakka}%`;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#FFC83D", padding: 90, fontFamily: "sans-serif", color: "#14110F" }}>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 800 }}>pakka<span style={{ color: "#FF5A36" }}>.</span></div>
        <div style={{ display: "flex", marginTop: 160, fontSize: 64, fontWeight: 800, background: "#14110F", color: "#FFC83D", padding: "14px 30px", alignSelf: "flex-start", borderRadius: 16 }}>
          {headline}
        </div>
        <div style={{ display: "flex", marginTop: 60, fontSize: 170, fontWeight: 800, lineHeight: 1 }}>{dest?.name ?? "TBD"}</div>
        <div style={{ display: "flex", marginTop: 30, fontSize: 52 }}>{wk?.label ?? ""}</div>
        <div style={{ display: "flex", marginTop: 50, fontSize: 44, lineHeight: 1.3, maxWidth: 880 }}>{dest?.tagline ?? ""}</div>
        <div style={{ display: "flex", flexWrap: "wrap", marginTop: 60, fontSize: 40 }}>
          {solo ? "Party of one. Hostel friends loading." : `${members.length} ${members.length === 1 ? "person" : "people"} in: ${members.slice(0, 6).map((m) => m.name).join(", ")}${members.length > 6 ? "…" : ""}`}
        </div>
        <div style={{ display: "flex", flex: 1 }} />
        <div style={{ display: "flex", flexDirection: "column", fontSize: 36, background: "#FFF8EE", border: "5px solid #14110F", borderRadius: 24, padding: 36 }}>
          <div style={{ display: "flex", fontWeight: 800, fontSize: 44 }}>Your trip dying in the group chat?</div>
          <div style={{ display: "flex", marginTop: 10 }}>{origin.replace(/^https?:\/\//, "")}</div>
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 24, color: "#5a4a1a" }}>Built by Ayush Arya Kashyap for the goSTOPS Build Sprint. Not an official goSTOPS product.</div>
      </div>
    ),
    { width: 1080, height: 1920 }
  );
}
