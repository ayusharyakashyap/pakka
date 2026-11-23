import { NextResponse } from "next/server";
import { allow, dbMissingInProd, getMembers, getPlan, getVotes } from "./store";
import { computeResults } from "./engine";

export const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

export const cleanText = (v: unknown, max = 40) =>
  typeof v === "string" ? v.replace(/[<>]/g, "").trim().slice(0, max) : "";

export const newId = (len = 7) => {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
};

/** Client IP (Vercel sets x-forwarded-for). Used only for rate limiting, never stored. */
export const ipOf = (req: Request) =>
  (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";

/** Shared guard for every write route: DB must exist on Vercel, and the IP must be under the limit. */
export async function guard(req: Request, action: string, limit: number, windowSec = 600) {
  if (dbMissingInProd) return bad("Database not connected. Add Upstash Redis in Vercel → Storage, then redeploy.", 503);
  if (!(await allow(`${action}:${ipOf(req)}`, limit, windowSec)))
    return bad("Whoa, slow down. Try again in a few minutes.", 429);
  return null;
}

/** Team devices (the builder's own phones/laptops) are excluded from all analytics. */
export const isTeam = (b: unknown) => !!(b && typeof b === "object" && (b as { team?: unknown }).team === true);

export async function fullPlan(id: string, viewerId?: string) {
  const plan = await getPlan(id);
  if (!plan) return null;
  const [members, votes] = await Promise.all([getMembers(id), getVotes(id)]);
  const results = computeResults(plan, members, votes);
  // budgets stay private: only fit flags are shared
  const publicMembers = members.map(({ budget: _b, ...m }) => m);
  // Over-budget flags could hint at someone's budget, so only the viewer sees their own.
  for (const r of results.ranking) for (const f of r.fits) if (f.memberId !== viewerId) f.overBudget = false;
  return { plan, members: publicMembers, votes, results };
}
