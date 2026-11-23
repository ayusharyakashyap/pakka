import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFC83D", border: "5px solid #14110F", borderRadius: 16, fontSize: 44, color: "#14110F", fontFamily: "sans-serif" }}>
        p<span style={{ color: "#FF5A36" }}>.</span>
      </div>
    ),
    size
  );
}
