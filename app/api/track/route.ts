import { NextResponse } from "next/server";
import { cleanText } from "@/lib/api";
import { addVisitor, bump, bumpBreakdown } from "@/lib/store";

const EVENTS = new Set(["visit", "share_whatsapp", "share_copy", "share_native", "gostops_click", "nudge", "story_card"]);

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const event = cleanText(b?.event, 30);
  const vid = cleanText(b?.vid, 40);
  if (!EVENTS.has(event)) return NextResponse.json({ ok: false });
  if (vid) await addVisitor(vid);
  await bump(event);
  if (event === "visit" && b?.src) await bumpBreakdown("src", cleanText(b.src, 30));
  if (event === "gostops_click" && b?.dest) await bumpBreakdown("dest", "click:" + cleanText(b.dest, 24));
  return NextResponse.json({ ok: true });
}
