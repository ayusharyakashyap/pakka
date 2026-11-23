import { DESTINATIONS, ORIGINS, VIBES, type Destination } from "./data";
import type { Member, Plan, Results, DestResult, MemberFit } from "./types";

const R = 6371;
function haversine(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const HOUR_VALUE = 250; // how much a student "pays" per hour of travel, used to pick a mode

/** Rough one-way travel estimate from an origin city to a destination. */
export function travel(originId: string, dest: Destination) {
  const o = ORIGINS.find((x) => x.id === originId) ?? ORIGINS[0];
  const km = haversine(o.lat, o.lng, dest.lat, dest.lng);
  if (km < 40) return { mode: "same city" as const, hours: 0.5, cost: 150, km };

  const road = km * (dest.hill ? 1.3 : 1.25);
  const groundHours = road / (dest.hill ? 45 : 55) + 0.5;
  const groundCost = Math.round(road * 1.5 + 150);

  const flightHours = 3 + km / 700 + dest.airportHrs;
  const flightCost = Math.round(1800 + km * 1.9 + dest.airportHrs * 300);

  const groundOk = groundHours <= 15;
  const pickGround =
    groundOk &&
    (km < 500 || groundHours * HOUR_VALUE + groundCost <= flightHours * HOUR_VALUE + flightCost);

  return pickGround
    ? { mode: "bus/train" as const, hours: round1(groundHours), cost: groundCost, km }
    : { mode: "flight" as const, hours: round1(flightHours), cost: flightCost, km };
}

const round1 = (x: number) => Math.round(x * 10) / 10;
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const COMMIT_WEIGHT = { 2: 1, 1: 0.6, 0: 0.15 } as const;

function memberFit(m: Member, d: Destination, nights: number): MemberFit {
  const t = travel(m.city, d);
  const cost = Math.round(t.cost * 2 + d.daily * (nights + 0.5));

  // Reachability: how much of a short trip is lost on the road.
  const limit = nights <= 2 ? 13 : 17;
  const reach = t.hours <= 5 ? 1 : clamp(1 - (t.hours - 5) / (limit - 5));

  // Budget: full marks under budget, falls off fast above it.
  const budgetFit = cost <= m.budget ? 1 : clamp(1 - (cost - m.budget) / (m.budget * 0.6));

  const vibeMatch = m.vibes.length
    ? m.vibes.filter((v) => d.vibes.includes(v)).length / Math.min(m.vibes.length, 2)
    : 0.6;

  const score = 0.38 * reach + 0.32 * budgetFit + 0.3 * clamp(vibeMatch);
  return {
    memberId: m.id,
    name: m.name,
    city: m.city,
    mode: t.mode,
    hours: t.hours,
    cost,
    overBudget: cost > m.budget,
    vibeMatch: clamp(vibeMatch),
    score,
  };
}

export function computeResults(plan: Plan, members: Member[], votes: Record<string, string>): Results {
  const weekends = plan.weekends;

  // 1. Best weekend: most people free, weighted by how committed they are.
  const weekendCounts = weekends.map((w) => {
    const avail = members.filter((m) => m.weekends.includes(w.id));
    return {
      id: w.id,
      count: avail.length,
      weighted: avail.reduce((s, m) => s + COMMIT_WEIGHT[m.commitment], 0) + (w.nights > 2 ? 0.3 : 0),
    };
  });
  const best = [...weekendCounts].sort((a, b) => b.weighted - a.weighted)[0];
  const bestWeekendId =
    plan.locked?.weekendId ?? (best && best.count > 0 ? best.id : null);
  const wk = weekends.find((w) => w.id === bestWeekendId) ?? weekends[0];
  const nights = wk?.nights ?? 2;
  const month = wk?.month ?? new Date().getMonth();

  let considered = members.filter((m) => bestWeekendId && m.weekends.includes(bestWeekendId));
  if (considered.length === 0) considered = members;

  // 2. Score every destination for everyone who can make it.
  const voteCount: Record<string, number> = {};
  Object.values(votes).forEach((d) => (voteCount[d] = (voteCount[d] ?? 0) + 1));

  const ranking: DestResult[] = DESTINATIONS.map((d) => {
    const fits = considered.map((m) => memberFit(m, d, nights));
    if (fits.length === 0) {
      return { destId: d.id, score: 0, avgCost: 0, maxHours: 0, votes: 0, reasons: [], fits };
    }
    const scores = fits.map((f) => f.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const min = Math.min(...scores);
    const season = d.season[month];
    // Fairness: the plan is only as good as it is for the unhappiest friend.
    let s = (0.55 * mean + 0.45 * min) * (0.55 + 0.45 * season);
    s += Math.min(0.12, (voteCount[d.id] ?? 0) * 0.04);
    const avgCost = Math.round(fits.reduce((a, f) => a + f.cost, 0) / fits.length);
    const maxHours = Math.max(...fits.map((f) => f.hours));

    const reasons: string[] = [];
    const allUnder = fits.every((f) => !f.overBudget);
    if (fits.length > 1 && allUnder) reasons.push("Fits everyone's budget");
    else if (fits.length === 1 && allUnder) reasons.push("Inside your budget");
    if (maxHours <= 8) reasons.push(`Nobody travels more than ${Math.ceil(maxHours)}h`);
    const sharedVibes = VIBES.filter(
      (v) => d.vibes.includes(v.id) && considered.filter((m) => m.vibes.includes(v.id)).length >= Math.max(1, Math.ceil(considered.length / 2))
    );
    if (sharedVibes.length)
      reasons.push(`${sharedVibes.map((v) => v.emoji + " " + v.label).slice(0, 2).join(" + ")} — what most of you want`);
    if (season >= 1) reasons.push("Peak season for these dates");
    else if (season <= 0.2) reasons.push("⚠️ Off-season for these dates");
    if (new Set(considered.map((m) => m.city)).size > 1 && min > 0.6)
      reasons.push("Fair meet-in-the-middle for different cities");

    return {
      destId: d.id,
      score: Math.round(clamp(s) * 100),
      avgCost,
      maxHours,
      votes: voteCount[d.id] ?? 0,
      reasons,
      fits,
    };
  }).sort((a, b) => b.score - a.score);

  // 3. The Pakka meter: how likely this trip actually leaves the group chat.
  const n = members.length;
  const response = plan.groupSize > 1 ? clamp(n / plan.groupSize) : n > 0 ? 1 : 0;
  const commit = n ? members.reduce((s, m) => s + COMMIT_WEIGHT[m.commitment], 0) / n : 0;
  const overlap = n && best ? best.count / n : 0;
  const fit = ranking[0] ? ranking[0].score / 100 : 0;
  let pakka = Math.round(100 * (0.3 * response + 0.3 * commit + 0.22 * overlap + 0.18 * fit));
  pakka = n === 0 ? 0 : Math.max(3, Math.min(plan.locked ? 100 : 96, pakka));
  if (plan.locked) pakka = 100;

  return {
    weekendCounts,
    bestWeekendId,
    considered: considered.length,
    ranking,
    pakka,
    verdict: verdictFor(pakka, plan, n),
  };
}

function verdictFor(p: number, plan: Plan, n: number) {
  if (plan.locked) return "It's PAKKA. No backing out now. Screenshot this.";
  if (plan.groupSize === 1) return n ? "Your solo weekend is basically planned. Just book it." : "Fill your card to see your trip.";
  const pending = Math.max(0, plan.groupSize - n);
  if (n === 0) return "Nobody's in yet. Be the first. Lead by example.";
  if (p < 30) return `Classic Goa plan energy. ${pending ? `${pending} still haven't replied.` : ""} Nudge them.`;
  if (p < 55) return `It could happen. ${pending ? `Waiting on ${pending} more.` : "Get the 'probably's to commit."}`;
  if (p < 80) return "This is looking real. Someone lock the plan before it dies.";
  return "Okay this is actually happening. Lock it now.";
}
