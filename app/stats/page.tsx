"use client";
import { useEffect, useState } from "react";
import { destById, originById } from "@/lib/data";

type Stats = {
  total: Record<string, number>;
  visitors: number;
  users: number;
  city: Record<string, number>;
  dest: Record<string, number>;
  src: Record<string, number>;
  daily: ({ date: string; visitors: number } & Record<string, number | string>)[];
  at?: number;
};

const top = (o: Record<string, number>, n = 8) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n);

export default function StatsPage() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => {
    const load = () => fetch("/api/stats", { cache: "no-store" }).then((r) => r.json()).then(setS).catch(() => {});
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);
  if (!s) return <p className="mt-20 text-center font-display text-xl font-bold">Counting…</p>;

  const t = s.total;
  const plans = (t.group_plans ?? 0) + (t.solo_plans ?? 0);
  const conv = s.visitors ? Math.round((s.users / s.visitors) * 100) : 0;
  const tiles: [string, number | string, string][] = [
    ["Real users", s.users, "unique devices that filled a card"],
    ["Visitors", s.visitors, "unique devices that opened Pakka"],
    ["Visitor → user", `${conv}%`, "opened it and filled a card"],
    ["Plans started", plans, `${t.group_plans ?? 0} gang · ${t.solo_plans ?? 0} solo`],
    ["Cards filled", t.joins ?? 0, "across all plans"],
    ["Trips locked", t.locks ?? 0, "went from chat to pakka"],
    ["Shares", (t.share_whatsapp ?? 0) + (t.share_copy ?? 0) + (t.share_native ?? 0) + (t.nudge ?? 0), "WhatsApp, link and nudges"],
    ["goSTOPS clicks", t.gostops_click ?? 0, "sent to a goSTOPS page"],
    ["Joiners → organisers", t.start_own ?? 0, "filled a friend's card, then started their own"],
    ["Avg cards / gang plan", t.group_plans ? ((t.joins ?? 0) - (t.solo_plans ?? 0)) / t.group_plans : 0, "the multiplier"],
  ];

  return (
    <div>
      <a href="/" className="font-display text-2xl font-extrabold">pakka<span className="text-chili">.</span></a>
      <h1 className="mt-6 font-display text-4xl font-extrabold">Live numbers</h1>
      <p className="text-ink/60">
        {s.at ? `As of ${new Date(s.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} IST. ` : ""}
        Refreshes on its own. Only counts are shown, nothing personal. The builder&apos;s own test devices are excluded.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {tiles.map(([k, v, sub]) => (
          <div key={k} className="card p-4">
            <div className="text-xs font-bold uppercase tracking-wide text-ink/50">{k}</div>
            <div className="font-display text-4xl font-extrabold">{typeof v === "number" ? (Number.isInteger(v) ? v.toLocaleString("en-IN") : v.toFixed(1)) : v}</div>
            <div className="text-xs text-ink/50">{sub}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl font-extrabold">Last 7 days</h2>
      <div className="card mt-3 overflow-x-auto p-2">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-ink/50"><th className="p-2">Day</th><th className="p-2">Visitors</th><th className="p-2">Cards</th><th className="p-2">Plans</th><th className="p-2">Shares</th></tr></thead>
          <tbody>
            {s.daily.map((d) => (
              <tr key={d.date} className="border-t border-ink/10">
                <td className="p-2">{d.date.slice(5)}</td>
                <td className="p-2">{d.visitors}</td>
                <td className="p-2">{Number(d.joins ?? 0)}</td>
                <td className="p-2">{Number(d.group_plans ?? 0) + Number(d.solo_plans ?? 0)}</td>
                <td className="p-2">{Number(d.share_whatsapp ?? 0) + Number(d.share_copy ?? 0) + Number(d.share_native ?? 0) + Number(d.nudge ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Box title="People travel from" rows={top(s.city).map(([k, v]) => [originById(k)?.name ?? k, v])} />
        <Box title="Trips locked to" rows={top(s.dest).filter(([k]) => !k.startsWith("click:")).map(([k, v]) => [destById(k)?.name ?? k, v])} />
        <Box title="Traffic from" rows={top(s.src)} />
      </div>
    </div>
  );
}

function Box({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="card p-4">
      <h3 className="font-display font-extrabold">{title}</h3>
      {rows.length === 0 && <p className="text-sm text-ink/40">Nothing yet</p>}
      <ul className="mt-2 space-y-1 text-sm">
        {rows.map(([k, v]) => <li key={k} className="flex justify-between"><span>{k}</span><b>{v}</b></li>)}
      </ul>
    </div>
  );
}
