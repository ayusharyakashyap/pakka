import { NextResponse } from "next/server";
import { bad, cleanText, fullPlan, guard, isTeam } from "@/lib/api";
import { bump, getMembers, getPlan, setVote } from "@/lib/store";
import { destById } from "@/lib/data";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await guard(req, "vote", 200);
  if (blocked) return blocked;
  const { id } = await params;
  const plan = await getPlan(cleanText(id, 12));
  if (!plan) return bad("Plan not found", 404);
  if (plan.locked) return bad("This plan is already locked");
  const b = await req.json().catch(() => null);
  const memberId = cleanText(b?.memberId, 24);
  const destId = cleanText(b?.destId, 24);
  if (!memberId || !destById(destId)) return bad("Invalid vote");
  const members = await getMembers(plan.id);
  if (!members.some((m) => m.id === memberId)) return bad("Fill your card first", 403);
  await setVote(plan.id, memberId, destId);
  if (!isTeam(b)) await bump("votes");
  return NextResponse.json(await fullPlan(plan.id, memberId));
}
