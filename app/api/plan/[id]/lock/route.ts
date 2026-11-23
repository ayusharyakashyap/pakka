import { NextResponse } from "next/server";
import { bad, cleanText, fullPlan, guard, isTeam } from "@/lib/api";
import { bump, bumpBreakdown, getAdminToken, getPlan, savePlan } from "@/lib/store";
import { destById } from "@/lib/data";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await guard(req, "lock", 60);
  if (blocked) return blocked;
  const { id } = await params;
  const plan = await getPlan(cleanText(id, 12));
  if (!plan) return bad("Plan not found", 404);
  const b = await req.json().catch(() => null);
  const token = cleanText(b?.adminToken, 40);
  if (!token || token !== (await getAdminToken(plan.id)))
    return bad("Only the person who started the plan can lock it", 403);
  const viewer = cleanText(b?.memberId, 24);
  if (b?.unlock) {
    delete plan.locked;
    await savePlan(plan);
    return NextResponse.json(await fullPlan(plan.id, viewer));
  }
  const destId = cleanText(b?.destId, 24);
  const weekendId = cleanText(b?.weekendId, 12);
  if (!destById(destId) || !plan.weekends.some((w) => w.id === weekendId)) return bad("Invalid choice");
  const firstLock = !plan.locked;
  plan.locked = { destId, weekendId, at: Date.now() };
  await savePlan(plan);
  if (firstLock && !isTeam(b)) {
    await bump("locks");
    await bumpBreakdown("dest", destId);
  }
  return NextResponse.json(await fullPlan(plan.id, viewer));
}
