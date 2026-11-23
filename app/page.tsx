"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSrc, getVid, postJSON, setAdmin } from "@/lib/client";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"group" | "solo" | null>(null);
  const [organizer, setOrganizer] = useState("");
  const [name, setName] = useState("");
  const [groupSize, setGroupSize] = useState(5);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [users, setUsers] = useState<number | null>(null);

  useEffect(() => {
    try { if (new URLSearchParams(location.search).get("mode") === "solo") setMode("solo"); } catch {}
    fetch("/api/stats?lite").then((r) => r.json()).then((s) => setUsers(s.users ?? null)).catch(() => {});
  }, []);

  async function create() {
    if (!organizer.trim()) return setErr("What should your friends call you?");
    setBusy(true);
    setErr("");
    const res = await postJSON<{ id: string; adminToken: string }>("/api/plan", {
      organizer,
      name,
      groupSize: mode === "solo" ? 1 : groupSize,
      vid: getVid(),
      src: getSrc(),
    });
    if (!res.ok) {
      setBusy(false);
      return setErr(res.error);
    }
    const data = res.data;
    setAdmin(data.id, data.adminToken);
    try { localStorage.setItem(`pakka_name`, organizer); } catch {}
    router.push(`/p/${data.id}?new=1`);
  }

  return (
    <div>
      <header className="flex items-center justify-between">
        <span className="font-display text-2xl font-extrabold tracking-tight">
          pakka<span className="text-chili">.</span>
        </span>
        <a href="/stats" className="text-sm font-semibold underline decoration-2 underline-offset-4">live numbers</a>
      </header>

      <section className="mt-10">
        <div className="inline-block -rotate-2 rounded-lg border-2 border-ink bg-sun px-3 py-1 font-display text-sm font-bold shadow-hardsm">
          RIP every Goa plan, 2019 – today
        </div>
        <h1 className="mt-5 font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
          Your trip is dying in the group chat.
          <span className="block text-chili">Make it pakka.</span>
        </h1>
        <p className="mt-5 text-lg text-ink/80">
          Drop one link in the group. Everyone fills a 30-second card: city, budget, free weekends, vibe.
          Pakka picks <b>where</b>, <b>when</b> and <b>how much</b>, fair for everyone, even if you&apos;re in five different cities.
        </p>
      </section>

      {!mode && (
        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          <button className="btn-primary py-5 text-lg" onClick={() => setMode("group")}>👯 Plan with my gang</button>
          <button className="btn-ghost py-5 text-lg" onClick={() => setMode("solo")}>🎒 Just me, solo</button>
          {users !== null && users > 0 && (
            <p className="col-span-full text-center text-sm text-ink/60">
              <b className="text-ink">{users.toLocaleString("en-IN")}</b> people have already filled their card
            </p>
          )}
        </section>
      )}

      {mode && (
        <section className="card pop mt-8 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-extrabold">
              {mode === "group" ? "Start the plan" : "Find my solo weekend"}
            </h2>
            <button className="text-sm underline" onClick={() => setMode(null)}>back</button>
          </div>

          <label className="label mt-5">Your name</label>
          <input className="input" placeholder="Arjun" value={organizer} maxLength={24}
            onChange={(e) => setOrganizer(e.target.value)} autoFocus />

          {mode === "group" && (
            <>
              <label className="label mt-5">Name the trip (optional)</label>
              <input className="input" placeholder="Goa plan v7 (this time for real)" value={name} maxLength={48}
                onChange={(e) => setName(e.target.value)} />
              <label className="label mt-5">How many in the gang? <span className="normal-case text-ink">{groupSize}</span></label>
              <input type="range" min={2} max={15} value={groupSize} onChange={(e) => setGroupSize(+e.target.value)}
                className="w-full accent-chili" />
            </>
          )}

          {err && <p className="mt-4 font-semibold text-chili">{err}</p>}
          <button className="btn-primary mt-6 w-full text-lg" onClick={create} disabled={busy}>
            {busy ? "Setting it up…" : mode === "group" ? "Create link →" : "Let's go →"}
          </button>
          <p className="mt-3 text-center text-xs text-ink/50">No sign-up. No app. Works in WhatsApp.</p>
        </section>
      )}

      <section className="mt-12 grid gap-4">
        {[
          ["1", "Drop the link", "Paste it in the group chat. That's the only effort required from the planner friend."],
          ["2", "Everyone fills a card", "City, budget, free weekends, vibe, and how in they really are. Budgets stay private."],
          ["3", "Pakka picks", "The weekend most people are free, and a place that's fair on travel time and budget for every single person."],
          ["4", "Lock it", "Once it's locked, it's pakka. Book beds, add to calendar, no backing out."],
        ].map(([n, t, d]) => (
          <div key={n} className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-sun font-display font-extrabold">{n}</div>
            <div>
              <h3 className="font-display text-lg font-bold">{t}</h3>
              <p className="text-ink/70">{d}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-2xl border-2 border-dashed border-ink/40 p-5 text-ink/80">
        <h3 className="font-display text-lg font-bold">Why this exists</h3>
        <p className="mt-2">
          Everyone has a trip that never left the WhatsApp group. Friends scatter to different cities after college,
          nobody wants to say their budget out loud, and nobody wants to be the one who decides. So the trip dies.
          Pakka does the awkward parts for you.
        </p>
      </section>
    </div>
  );
}
