import { NextResponse } from "next/server";
import { bad, cleanText, fullPlan } from "@/lib/api";
import { addUser, addVisitor, bump, bumpBreakdown, getMembers, getPlan, upsertMember } from "@/lib/store";
import { ORIGINS, VIBES, type Vibe } from "@/lib/data";
import type { Commitment, Member } from "@/lib/types";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await getPlan(id);
  if (!plan) return bad("Plan not found", 404);
  const b = await req.json().catch(() => null);
  if (!b) return bad("Invalid body");

  const memberId = cleanText(b.memberId, 24);
  const name = cleanText(b.name, 24);
  if (!memberId || !name) return bad("Name is required");
  const city = ORIGINS.some((o) => o.id === b.city) ? b.city : null;
  if (!city) return bad("Pick your city");
  const budget = Math.max(1000, Math.min(100000, Math.round(Number(b.budget) || 0)));
  const validWk = new Set(plan.weekends.map((w) => w.id));
  const weekends = (Array.isArray(b.weekends) ? b.weekends : []).filter((w: string) => validWk.has(w)).slice(0, 12);
  if (weekends.length === 0) return bad("Pick at least one weekend");
  const vibeIds = new Set(VIBES.map((v) => v.id));
  const vibes = (Array.isArray(b.vibes) ? b.vibes : []).filter((v: Vibe) => vibeIds.has(v)).slice(0, 3);
  const commitment = ([0, 1, 2].includes(b.commitment) ? b.commitment : 1) as Commitment;

  const existing = await getMembers(id);
  const prev = existing.find((m) => m.id === memberId);
  if (!prev && existing.length >= 40) return bad("This plan is full");

  const member: Member = {
    id: memberId, name, city, budget, weekends, vibes, commitment,
    joinedAt: prev?.joinedAt ?? Date.now(),
  };
  await upsertMember(id, member);

  if (!prev) {
    await bump("joins");
    await bumpBreakdown("city", city);
  }
  const vid = cleanText(b.vid, 40);
  if (vid) await Promise.all([addVisitor(vid), addUser(vid)]);

  return NextResponse.json(await fullPlan(id));
}
