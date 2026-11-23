import { NextResponse } from "next/server";
import { bad, cleanText, guard, isTeam, newId } from "@/lib/api";
import { addVisitor, bump, bumpBreakdown, saveAdminToken, savePlan } from "@/lib/store";
import { upcomingWeekends } from "@/lib/weekends";
import type { Plan } from "@/lib/types";

export async function POST(req: Request) {
  const blocked = await guard(req, "create", 30);
  if (blocked) return blocked;
  const body = await req.json().catch(() => null);
  if (!body) return bad("Invalid body");
  const organizer = cleanText(body.organizer, 24);
  if (!organizer) return bad("Tell us your name");
  const groupSize = Math.max(1, Math.min(30, Number(body.groupSize) || 1));
  const solo = groupSize === 1;
  const name = cleanText(body.name, 48) || (solo ? `${organizer}'s solo escape` : `${organizer}'s gang trip`);

  const plan: Plan = {
    id: newId(),
    name,
    organizer,
    groupSize,
    createdAt: Date.now(),
    weekends: upcomingWeekends(12),
  };
  const adminToken = newId(20);
  await Promise.all([savePlan(plan), saveAdminToken(plan.id, adminToken)]);
  if (!isTeam(body)) {
    await bump(solo ? "solo_plans" : "group_plans");
    if (body.vid) await addVisitor(cleanText(body.vid, 40));
    if (body.src) await bumpBreakdown("src", cleanText(body.src, 30));
  }
  return NextResponse.json({ id: plan.id, adminToken });
}
