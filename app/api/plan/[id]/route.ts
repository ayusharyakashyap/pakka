import { NextResponse } from "next/server";
import { bad, fullPlan } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await fullPlan(id);
  if (!data) return bad("Plan not found", 404);
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
