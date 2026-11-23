import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Pakka: the trip that actually leaves the group chat";

export default function OG() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FFF8EE", padding: 64, fontFamily: "sans-serif", color: "#14110F" }}>
        <div style={{ display: "flex", fontSize: 44 }}>pakka<span style={{ color: "#FF5A36" }}>.</span></div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 30, background: "#FFC83D", border: "4px solid #14110F", borderRadius: 14, padding: "8px 18px", alignSelf: "flex-start" }}>
            RIP every Goa plan, 2019 – today
          </div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 84, lineHeight: 1.02 }}>Your trip is dying in the group chat.</div>
          <div style={{ display: "flex", fontSize: 84, color: "#FF5A36" }}>Make it pakka.</div>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#555" }}>One link. Everyone fills a 30-sec card. It picks where, when and how much.</div>
      </div>
    ),
    size
  );
}
