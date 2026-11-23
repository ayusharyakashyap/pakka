import { NextResponse } from "next/server";
import { getStats, getUserCount, dbMissingInProd } from "@/lib/store";

export const dynamic = "force-dynamic";

// Cached at Vercel's edge so a traffic spike doesn't burn the free Redis quota.
export async function GET(req: Request) {
  if (dbMissingInProd) return NextResponse.json({ error: "Database not connected" }, { status: 503 });
  const lite = new URL(req.url).searchParams.has("lite");
  const body = lite ? { users: await getUserCount() } : { ...(await getStats(7)), at: Date.now() };
  return NextResponse.json(body, {
    headers: { "Cache-Control": `public, s-maxage=${lite ? 60 : 15}, stale-while-revalidate=60` },
  });
}
