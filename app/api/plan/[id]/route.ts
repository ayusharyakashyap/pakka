import { NextResponse } from "next/server";
import { bad, cleanText, fullPlan } from "@/lib/api";
import { dbMissingInProd } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (dbMissingInProd) return bad("Database not connected. Add Upstash Redis in Vercel → Storage, then redeploy.", 503);
  const { id } = await params;
  const viewer = cleanText(new URL(req.url).searchParams.get("m"), 24);
  const data = await fullPlan(cleanText(id, 12), viewer);
  if (!data) return bad("Plan not found", 404);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
