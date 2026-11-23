import { Redis } from "@upstash/redis";
import type { Member, Plan } from "./types";

// Uses Upstash Redis when env vars exist (Vercel integration fills them in).
// Falls back to in-memory storage for local dev.
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

const TTL = 60 * 60 * 24 * 180; // plans live 6 months

type Mem = {
  kv: Map<string, unknown>;
  hashes: Map<string, Map<string, unknown>>;
  sets: Map<string, Set<string>>;
};
const g = globalThis as unknown as { __pakkaMem?: Mem };
const mem: Mem = (g.__pakkaMem ??= { kv: new Map(), hashes: new Map(), sets: new Map() });
const h = (k: string) => {
  if (!mem.hashes.has(k)) mem.hashes.set(k, new Map());
  return mem.hashes.get(k)!;
};

const parse = <T>(v: unknown): T => (typeof v === "string" ? (JSON.parse(v) as T) : (v as T));
const today = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

export const usingRedis = !!redis;

// On Vercel, never silently fall back to memory: each server instance would have its own copy
// and plans would randomly "disappear". Fail loudly instead so a missing DB is caught in testing.
export const dbMissingInProd = !redis && !!process.env.VERCEL;

/** Fixed-window rate limit per key. Returns true if the request is allowed. */
export async function allow(key: string, limit: number, windowSec: number): Promise<boolean> {
  const k = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSec)}`;
  if (redis) {
    const n = await redis.incr(k);
    if (n === 1) await redis.expire(k, windowSec);
    return n <= limit;
  }
  const n = ((mem.kv.get(k) as number) ?? 0) + 1;
  mem.kv.set(k, n);
  return n <= limit;
}

export async function getUserCount() {
  return card("stats:users");
}

export async function savePlan(plan: Plan) {
  if (redis) await redis.set(`plan:${plan.id}`, JSON.stringify(plan), { ex: TTL });
  else mem.kv.set(`plan:${plan.id}`, plan);
}

export async function getPlan(id: string): Promise<Plan | null> {
  const v = redis ? await redis.get(`plan:${id}`) : mem.kv.get(`plan:${id}`);
  return v ? parse<Plan>(v) : null;
}

export async function saveAdminToken(id: string, tokenValue: string) {
  if (redis) await redis.set(`admin:${id}`, tokenValue, { ex: TTL });
  else mem.kv.set(`admin:${id}`, tokenValue);
}
export async function getAdminToken(id: string): Promise<string | null> {
  const v = redis ? await redis.get(`admin:${id}`) : mem.kv.get(`admin:${id}`);
  return v ? String(v) : null;
}

export async function upsertMember(planId: string, m: Member) {
  const key = `members:${planId}`;
  if (redis) {
    await redis.hset(key, { [m.id]: JSON.stringify(m) });
    await redis.expire(key, TTL);
  } else h(key).set(m.id, m);
}

export async function getMembers(planId: string): Promise<Member[]> {
  const key = `members:${planId}`;
  const raw = redis ? ((await redis.hgetall(key)) ?? {}) : Object.fromEntries(h(key));
  return Object.values(raw)
    .map((v) => parse<Member>(v))
    .sort((a, b) => a.joinedAt - b.joinedAt);
}

export async function setVote(planId: string, memberId: string, destId: string) {
  const key = `votes:${planId}`;
  if (redis) {
    await redis.hset(key, { [memberId]: destId });
    await redis.expire(key, TTL);
  } else h(key).set(memberId, destId);
}

export async function getVotes(planId: string): Promise<Record<string, string>> {
  const key = `votes:${planId}`;
  const raw = redis ? ((await redis.hgetall(key)) ?? {}) : Object.fromEntries(h(key));
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) out[k] = String(v);
  return out;
}

// ---------- analytics (the numbers for the write-up) ----------

export async function bump(field: string, by = 1) {
  if (redis) {
    await Promise.all([
      redis.hincrby("stats:total", field, by),
      redis.hincrby(`stats:day:${today()}`, field, by),
    ]);
  } else {
    const t = h("stats:total");
    t.set(field, ((t.get(field) as number) ?? 0) + by);
    const d = h(`stats:day:${today()}`);
    d.set(field, ((d.get(field) as number) ?? 0) + by);
  }
}

export async function bumpBreakdown(kind: "city" | "dest" | "src", key: string) {
  if (redis) await redis.hincrby(`stats:${kind}`, key, 1);
  else {
    const t = h(`stats:${kind}`);
    t.set(key, ((t.get(key) as number) ?? 0) + 1);
  }
}

export async function addVisitor(vid: string) {
  if (redis) {
    await Promise.all([
      redis.sadd("stats:visitors", vid),
      redis.sadd(`stats:visitors:${today()}`, vid),
    ]);
  } else {
    for (const k of ["stats:visitors", `stats:visitors:${today()}`]) {
      if (!mem.sets.has(k)) mem.sets.set(k, new Set());
      mem.sets.get(k)!.add(vid);
    }
  }
}

export async function addUser(vid: string) {
  // a "user" = a unique device that actually filled a card
  if (redis) await redis.sadd("stats:users", vid);
  else {
    if (!mem.sets.has("stats:users")) mem.sets.set("stats:users", new Set());
    mem.sets.get("stats:users")!.add(vid);
  }
}

async function card(k: string) {
  return redis ? await redis.scard(k) : mem.sets.get(k)?.size ?? 0;
}
async function hall(k: string): Promise<Record<string, number>> {
  const raw = redis ? ((await redis.hgetall(k)) ?? {}) : Object.fromEntries(h(k));
  const out: Record<string, number> = {};
  for (const [a, b] of Object.entries(raw)) out[a] = Number(b);
  return out;
}

export async function getStats(days = 7) {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    dates.push(new Date(Date.now() + 5.5 * 3600 * 1000 - i * 86400000).toISOString().slice(0, 10));
  }
  const [total, visitors, users, city, dest, src, daily] = await Promise.all([
    hall("stats:total"),
    card("stats:visitors"),
    card("stats:users"),
    hall("stats:city"),
    hall("stats:dest"),
    hall("stats:src"),
    Promise.all(
      dates.map(async (d) => ({
        date: d,
        ...(await hall(`stats:day:${d}`)),
        visitors: await card(`stats:visitors:${d}`),
      }))
    ),
  ]);
  return { total, visitors, users, city, dest, src, daily };
}
