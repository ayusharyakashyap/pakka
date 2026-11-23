import { NextResponse } from "next/server";
import { bad, cleanText, fullPlan } from "@/lib/api";
import { bump, getMembers, setVote } from "@/lib/store";
import { destById } from "@/lib/data";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json().catch(() => null);
  const memberId = cleanText(b?.memberId, 24);
  const destId = cleanText(b?.destId, 24);
  if (!memberId || !destById(destId)) return bad("Invalid vote");
  const members = await getMembers(id);
  if (!members.some((m) => m.id === memberId)) return bad("Fill your card first", 403);
  await setVote(id, memberId, destId);
  await bump("votes");
  return NextResponse.json(await fullPlan(id));
}
