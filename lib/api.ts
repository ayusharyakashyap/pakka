import { NextResponse } from "next/server";
import { getMembers, getPlan, getVotes } from "./store";
import { computeResults } from "./engine";

export const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

export const cleanText = (v: unknown, max = 40) =>
  typeof v === "string" ? v.replace(/[<>]/g, "").trim().slice(0, max) : "";

export const newId = (len = 7) => {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
};

export async function fullPlan(id: string) {
  const plan = await getPlan(id);
  if (!plan) return null;
  const [members, votes] = await Promise.all([getMembers(id), getVotes(id)]);
  const results = computeResults(plan, members, votes);
  // budgets stay private: only fit flags are shared
  const publicMembers = members.map(({ budget: _b, ...m }) => m);
  return { plan, members: publicMembers, votes, results };
}
