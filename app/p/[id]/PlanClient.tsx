"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DESTINATIONS, ORIGINS, VIBES, destById, originById, type Vibe } from "@/lib/data";
import type { Commitment, Member, Plan, Results } from "@/lib/types";
import { getAdmin, getVid, inr, memberIdFor, setAdmin, track, whatsappLink } from "@/lib/client";

type PublicMember = Omit<Member, "budget">;
type Data = { plan: Plan; members: PublicMember[]; votes: Record<string, string>; results: Results };

const COMMIT: { v: Commitment; label: string; sub: string }[] = [
  { v: 2, label: "100% in", sub: "Book it" },
  { v: 1, label: "Probably", sub: "If dates work" },
  { v: 0, label: "Don't count on me", sub: "Honest, at least" },
];

export default function PlanClient({ id }: { id: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [me, setMe] = useState("");
  const [admin, setAdminTok] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/plan/${id}`, { cache: "no-store" });
    if (r.status === 404) return setNotFound(true);
    setData(await r.json());
  }, [id]);

  useEffect(() => {
    setMe(memberIdFor(id));
    const qs = new URLSearchParams(location.search);
    const adminParam = qs.get("admin");
    if (adminParam) {
      setAdmin(id, adminParam);
      qs.delete("admin");
      history.replaceState(null, "", `${location.pathname}${qs.toString() ? "?" + qs : ""}`);
    }
    setAdminTok(getAdmin(id));
    setUrl(`${location.origin}/p/${id}`);
    load();
    const t = setInterval(() => { if (document.visibilityState === "visible") load(); }, 6000);
    return () => clearInterval(t);
  }, [id, load]);

  if (notFound)
    return (
      <div className="card p-6 text-center">
        <h1 className="font-display text-2xl font-extrabold">This plan doesn&apos;t exist (anymore).</h1>
        <a href="/" className="btn-primary mt-5">Start a new one</a>
      </div>
    );
  if (!data) return <p className="mt-20 text-center font-display text-xl font-bold wiggle">Loading the gang…</p>;

  const { plan, members, results } = data;
  const solo = plan.groupSize === 1;
  const mine = members.find((m) => m.id === me);
  const showForm = !mine || editing;
  const isAdmin = !!admin;

  const inviteText = solo
    ? `Found my next solo weekend in 30 seconds. Find yours: ${url}?src=wa`
    : `Okay this time it's actually happening 😤 "${plan.name}" — fill your card (30 sec, budgets stay private): ${url}?src=wa`;

  async function share(kind: "whatsapp" | "copy" | "native") {
    track(`share_${kind}`);
    if (kind === "copy") {
      try { await navigator.clipboard.writeText(inviteText); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
    } else if (kind === "native" && navigator.share) {
      navigator.share({ title: plan.name, text: inviteText }).catch(() => {});
    }
  }

  return (
    <div>
      <header className="flex items-center justify-between">
        <a href="/" className="font-display text-2xl font-extrabold tracking-tight">pakka<span className="text-chili">.</span></a>
        {mine && !editing && <button className="text-sm font-semibold underline" onClick={() => setEditing(true)}>edit my card</button>}
      </header>

      <section className="mt-6">
        <p className="font-semibold text-ink/60">{solo ? "Solo mode 🎒" : `${plan.organizer} started a plan`}</p>
        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight">{plan.name}</h1>
      </section>

      {showForm && !mine && !solo && members.length > 0 && (
        <p className="mt-4 rounded-xl border-2 border-ink bg-sun px-4 py-3 font-semibold shadow-hardsm">
          {members.slice(0, 3).map((m) => m.name).join(", ")}
          {members.length > 3 ? ` and ${members.length - 3} more` : ""} {members.length === 1 ? "is" : "are"} in.
          {plan.groupSize > members.length ? " Waiting on you 👀" : ""}
        </p>
      )}
      {showForm ? (
        <JoinForm
          plan={plan}
          memberId={me}
          existing={mine}
          defaultName={!mine && isAdmin ? plan.organizer : ""}
          onDone={(d) => { setData(d); setEditing(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        />
      ) : (
        <>
          <PakkaMeter data={data} solo={solo} />

          {!plan.locked && (
            <section className="card mt-5 p-5">
              <h2 className="font-display text-lg font-extrabold">{solo ? "Tell a friend who needs a break" : "Get everyone in"}</h2>
              {!solo && <p className="text-sm text-ink/60">More cards = better pick. The plan updates live.</p>}
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <a className="btn-wa" href={whatsappLink(inviteText)} target="_blank" rel="noreferrer" onClick={() => share("whatsapp")}>Send on WhatsApp</a>
                <button className="btn-ghost" onClick={() => (typeof navigator !== "undefined" && "share" in navigator ? share("native") : share("copy"))}>
                  {copied ? "Copied ✓" : "Share / copy link"}
                </button>
              </div>
              {!solo && members.length < plan.groupSize && (
                <a className="mt-3 block text-center text-sm font-semibold underline"
                  href={whatsappLink(`Reminder for the ${plan.groupSize - members.length} people who haven't filled the card for "${plan.name}" 👀 It's 30 seconds. Don't be the reason this dies: ${url}?src=nudge`)}
                  target="_blank" rel="noreferrer" onClick={() => track("nudge")}>
                  👻 Nudge the ghosts ({plan.groupSize - members.length} pending)
                </a>
              )}
            </section>
          )}

          {!solo && !isAdmin && (
            <section className="card mt-5 bg-sun/40 p-5">
              <h2 className="font-display text-lg font-extrabold">Got another group chat where a trip is dying?</h2>
              <p className="text-sm text-ink/70">College gang, school friends, cousins. Start a plan there too. Takes 10 seconds.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <a href="/?src=joiner" className="btn-ghost" onClick={() => track("start_own")}>👯 Start my own plan</a>
                <a href="/?src=joiner&mode=solo" className="btn-ghost" onClick={() => track("start_own")}>🎒 Plan a solo weekend</a>
              </div>
            </section>
          )}

          {isAdmin && !solo && <OrganiserLink url={`${url}?admin=${admin}`} />}

          {!solo && <WeekendStrip data={data} />}

          <section className="mt-8">
            <h2 className="font-display text-2xl font-extrabold">{plan.locked ? "The plan" : solo ? "Your best bets" : "Top picks for the gang"}</h2>
            {!plan.locked && !solo && <p className="text-sm text-ink/60">Ranked for fairness: a place only scores high if it works for the person it works least for. Tap ❤️ to vote.</p>}
            <div className="mt-4 grid gap-4">
              {(plan.locked ? results.ranking.filter((r) => r.destId === plan.locked!.destId) : results.ranking.slice(0, 3)).map((r, i) => (
                <DestCard key={r.destId} r={r} rank={i} data={data} me={me} admin={admin} solo={solo} onData={setData} hasCard={!!mine} />
              ))}
            </div>
            {!plan.locked && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold underline">See all {DESTINATIONS.length} places</summary>
                <ul className="mt-3 grid gap-1 text-sm">
                  {results.ranking.slice(3).map((r) => (
                    <li key={r.destId} className="flex justify-between border-b border-ink/10 py-1">
                      <span>{destById(r.destId)?.name}</span>
                      <span className="text-ink/60">{r.score}/100 · ~{inr(r.avgCost)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          {!solo && (
            <section className="mt-8">
              <h2 className="font-display text-lg font-extrabold">Who&apos;s in ({members.length}{plan.groupSize > members.length ? `/${plan.groupSize}` : ""})</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {members.map((m) => (
                  <span key={m.id} className={`chip ${m.commitment === 2 ? "bg-leaf/20" : m.commitment === 0 ? "bg-ink/5 text-ink/50" : ""}`}>
                    {m.name} · {originById(m.city)?.name} {m.commitment === 2 ? "✅" : m.commitment === 1 ? "🤔" : "👻"}
                  </span>
                ))}
                {Array.from({ length: Math.max(0, plan.groupSize - members.length) }).map((_, i) => (
                  <span key={i} className="chip border-dashed text-ink/40">waiting…</span>
                ))}
              </div>
            </section>
          )}

          {solo && (
            <section className="card mt-8 bg-sun/40 p-5">
              <h3 className="font-display text-lg font-extrabold">Actually, want to drag friends along?</h3>
              <p className="text-sm text-ink/70">Start a gang plan and drop it in the group chat.</p>
              <a href="/" className="btn-ghost mt-3">Start a gang plan</a>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function JoinForm({ plan, memberId, existing, defaultName, onDone }: {
  plan: Plan; memberId: string; existing?: PublicMember; defaultName: string; onDone: (d: Data) => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [city, setCity] = useState(existing?.city ?? "");
  const [budget, setBudget] = useState(6000);
  const [weekends, setWeekends] = useState<string[]>(existing?.weekends ?? []);
  const [vibes, setVibes] = useState<Vibe[]>(existing?.vibes ?? []);
  const [commitment, setCommitment] = useState<Commitment>(existing?.commitment ?? 2);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const solo = plan.groupSize === 1;

  useEffect(() => {
    if (!existing) {
      let saved = "";
      try { saved = localStorage.getItem("pakka_name") || ""; } catch {}
      setName(defaultName || saved);
      try {
        const c = localStorage.getItem("pakka_city"); if (c) setCity(c);
        const b = localStorage.getItem("pakka_budget"); if (b) setBudget(+b);
      } catch {}
    }
  }, [existing, defaultName]);

  const toggle = <T,>(arr: T[], v: T, max = 99) => (arr.includes(v) ? arr.filter((x) => x !== v) : arr.length >= max ? arr : [...arr, v]);

  async function submit() {
    if (!name.trim()) return setErr("Your name?");
    if (!city) return setErr("Where are you travelling from?");
    if (!weekends.length) return setErr("Pick at least one weekend you're free");
    setBusy(true); setErr("");
    try {
      localStorage.setItem("pakka_name", name); localStorage.setItem("pakka_city", city); localStorage.setItem("pakka_budget", String(budget));
    } catch {}
    const r = await fetch(`/api/plan/${plan.id}/join`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, name, city, budget, weekends, vibes, commitment: solo ? 2 : commitment, vid: getVid() }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(d.error || "Something broke, try again");
    onDone(d);
  }

  return (
    <section className="card pop mt-6 p-5 sm:p-6">
      <h2 className="font-display text-xl font-extrabold">{existing ? "Edit your card" : solo ? "Your card" : "Fill your card · 30 sec"}</h2>

      <label className="label mt-5">Name</label>
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="Riya" />

      <label className="label mt-5">Travelling from</label>
      <select className="input" value={city} onChange={(e) => setCity(e.target.value)}>
        <option value="">Pick your city</option>
        {ORIGINS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>

      <label className="label mt-5">
        Max budget, all in <span className="normal-case text-ink">{inr(budget)}</span>
        {!solo && <span className="ml-2 normal-case text-ink/50">(private, nobody sees it)</span>}
      </label>
      <input type="range" min={2000} max={30000} step={500} value={budget} onChange={(e) => setBudget(+e.target.value)} className="w-full accent-chili" />
      <div className="flex justify-between text-xs text-ink/50"><span>₹2k broke era</span><span>₹30k salary just hit</span></div>

      <label className="label mt-5">Weekends you&apos;re free <span className="normal-case text-ink/50">(tap all that work)</span></label>
      <div className="grid grid-cols-2 gap-2">
        {plan.weekends.map((w) => (
          <button key={w.id} type="button" onClick={() => setWeekends(toggle(weekends, w.id))}
            className={`rounded-xl border-2 border-ink px-3 py-2 text-left text-sm font-semibold transition ${weekends.includes(w.id) ? "bg-ink text-white" : "bg-white"} ${w.tag && !weekends.includes(w.id) ? "border-chili" : ""}`}>
            <span className="block text-[11px] font-medium opacity-60">{w.nights + 1} days</span>
            {shortRange(w.startISO, w.endISO)}
            {w.tag && <span className={`block text-[11px] font-bold leading-tight ${weekends.includes(w.id) ? "text-sun" : "text-chili"}`}>{w.tag}</span>}
          </button>
        ))}
      </div>

      <label className="label mt-5">Vibe <span className="normal-case text-ink/50">(up to 3)</span></label>
      <div className="flex flex-wrap gap-2">
        {VIBES.map((v) => (
          <button key={v.id} type="button" onClick={() => setVibes(toggle(vibes, v.id, 3))}
            className={`chip ${vibes.includes(v.id) ? "chip-on" : ""}`}>{v.emoji} {v.label}</button>
        ))}
      </div>

      {!solo && (
        <>
          <label className="label mt-5">Be honest. How in are you?</label>
          <div className="grid grid-cols-3 gap-2">
            {COMMIT.map((c) => (
              <button key={c.v} type="button" onClick={() => setCommitment(c.v)}
                className={`rounded-xl border-2 border-ink p-2 text-center ${commitment === c.v ? "bg-ink text-white" : "bg-white"}`}>
                <span className="block font-display text-sm font-bold">{c.label}</span>
                <span className="block text-[11px] opacity-70">{c.sub}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {err && <p className="mt-4 font-semibold text-chili">{err}</p>}
      <button className="btn-primary mt-6 w-full text-lg" onClick={submit} disabled={busy}>
        {busy ? "Crunching…" : existing ? "Update" : solo ? "Find my weekend →" : "I'm in →"}
      </button>
    </section>
  );
}

function PakkaMeter({ data, solo }: { data: Data; solo: boolean }) {
  const { results, plan } = data;
  const p = results.pakka;
  const color = plan.locked ? "bg-leaf" : p < 35 ? "bg-chili" : p < 70 ? "bg-sun" : "bg-leaf";
  if (solo) return null;
  return (
    <section className="card pop mt-6 overflow-hidden">
      <div className="p-5">
        <div className="flex items-end justify-between">
          <span className="font-display text-sm font-bold uppercase tracking-wide text-ink/60">Pakka meter</span>
          <span className={`font-display font-extrabold ${plan.locked ? "text-3xl" : "text-5xl"}`}>{plan.locked ? "PAKKA ✅" : `${p}%`}</span>
        </div>
        <div className="mt-3 h-5 overflow-hidden rounded-full border-2 border-ink bg-paper">
          <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${Math.max(4, p)}%` }} />
        </div>
        <p className="mt-3 font-semibold">{results.verdict}</p>
        <p className="mt-1 text-xs text-ink/50">Chance this trip actually leaves the group chat, based on replies, commitment and date overlap.</p>
      </div>
    </section>
  );
}

function WeekendStrip({ data }: { data: Data }) {
  const { plan, results, members } = data;
  const max = Math.max(1, ...results.weekendCounts.map((w) => w.count));
  const bestRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bestRef.current?.parentElement?.scrollTo({ left: Math.max(0, (bestRef.current.offsetLeft ?? 0) - 80), behavior: "smooth" });
  }, [results.bestWeekendId]);
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-extrabold">When everyone&apos;s free</h2>
      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-2">
        {plan.weekends.map((w) => {
          const c = results.weekendCounts.find((x) => x.id === w.id)?.count ?? 0;
          const best = w.id === results.bestWeekendId;
          return (
            <div key={w.id} ref={best ? bestRef : undefined} className={`flex min-w-[64px] flex-col items-center rounded-xl border-2 p-2 text-center ${best ? "border-ink bg-sun shadow-hardsm" : "border-ink/20 bg-white"}`}>
              <div className="flex h-16 w-6 items-end overflow-hidden rounded bg-ink/5">
                <div className="w-full bg-ink" style={{ height: `${(c / max) * 100}%` }} />
              </div>
              <span className="mt-1 text-[11px] font-bold leading-tight">{w.label.split(" – ")[0].replace(/^\w+ /, "")}</span>
              <span className="text-[11px] text-ink/60">{c}/{members.length}</span>
              {w.tag && <span className="text-[10px] font-bold text-chili">long</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function googleCal(title: string, startISO: string, endISO: string, details: string) {
  const s = startISO.replace(/-/g, "");
  const e = new Date(endISO + "T00:00:00Z");
  e.setUTCDate(e.getUTCDate() + 1);
  const en = e.toISOString().slice(0, 10).replace(/-/g, "");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${s}/${en}&details=${encodeURIComponent(details)}`;
}

function DestCard({ r, rank, data, me, admin, solo, onData, hasCard }: {
  r: Results["ranking"][number]; rank: number; data: Data; me: string; admin: string | null; solo: boolean; onData: (d: Data) => void; hasCard: boolean;
}) {
  const { plan, results, votes } = data;
  const d = destById(r.destId)!;
  const wkId = plan.locked?.weekendId ?? results.bestWeekendId;
  const wk = plan.weekends.find((w) => w.id === wkId);
  const myVote = votes[me] === r.destId;
  const [busy, setBusy] = useState(false);
  const daysTo = useMemo(() => wk ? Math.max(0, Math.ceil((new Date(wk.startISO + "T18:00:00+05:30").getTime() - Date.now()) / 86400000)) : null, [wk]);
  const gostopsUrl = `https://gostops.com/stay/${d.gostops}${wk ? `?checkin=${wk.startISO}&checkout=${wk.endISO}` : ""}`;

  async function vote() {
    setBusy(true);
    const res = await fetch(`/api/plan/${plan.id}/vote`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId: me, destId: r.destId }) });
    if (res.ok) onData(await res.json());
    setBusy(false);
  }
  async function lock(unlock = false) {
    if (!wkId) return;
    setBusy(true);
    const res = await fetch(`/api/plan/${plan.id}/lock`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ adminToken: admin, destId: r.destId, weekendId: wkId, unlock }) });
    if (res.ok) onData(await res.json());
    setBusy(false);
  }

  const locked = !!plan.locked;
  return (
    <article className={`card pop overflow-hidden ${locked ? "ring-4 ring-leaf" : ""}`} style={{ animationDelay: `${rank * 80}ms` }}>
      <div className={`flex items-start justify-between gap-3 border-b-2 border-ink p-4 ${locked ? "bg-leaf/20" : rank === 0 ? "bg-sun" : "bg-white"}`}>
        <div>
          <span className="text-xs font-bold uppercase tracking-wide text-ink/60">
            {locked ? `Locked · ${wk?.label}` : rank === 0 ? `#1 pick · ${wk?.label ?? ""}` : `#${rank + 1}`}
          </span>
          <h3 className="font-display text-3xl font-extrabold leading-none">{d.name}</h3>
          <p className="mt-1 text-sm text-ink/70">{d.tagline}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-display text-3xl font-extrabold">{r.score}</div>
          <div className="text-[11px] font-bold uppercase text-ink/50">fit</div>
        </div>
      </div>

      <div className="p-4">
        {locked && daysTo !== null && (
          <p className="mb-3 rounded-xl bg-ink p-3 text-center font-display text-lg font-extrabold text-sun">
            {daysTo === 0 ? "It's today. GO." : `${daysTo} days to go. No backing out.`}
          </p>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span>💸 ~{inr(r.avgCost)} each, all in</span>
          <span>🕒 max {Math.ceil(r.maxHours)}h travel</span>
          {r.votes > 0 && <span>❤️ {r.votes}</span>}
        </div>
        <ul className="mt-3 space-y-1 text-sm">
          {r.reasons.slice(0, 3).map((x) => <li key={x}>✓ {x}</li>)}
        </ul>
        {solo && <p className="mt-3 rounded-xl bg-paper p-3 text-sm">🎒 <b>Solo?</b> {d.solo}</p>}

        {!solo && (
          <div className="mt-4 grid gap-1.5">
            {r.fits.map((f) => (
              <div key={f.memberId} className="flex items-center justify-between rounded-lg bg-paper px-3 py-1.5 text-sm">
                <span className="font-semibold">{f.name} <span className="font-normal text-ink/50">from {originById(f.city)?.name}</span></span>
                <span className={f.memberId === me && f.overBudget ? "font-semibold text-chili" : ""}>
                  {f.mode === "flight" ? "✈️" : f.mode === "same city" ? "🏠" : "🚌"} {f.hours}h{f.memberId === me ? ` · ${inr(f.cost)}${f.overBudget ? " (over)" : " ✓"}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
        {solo && r.fits[0] && (
          <p className="mt-3 text-sm text-ink/70">
            {r.fits[0].mode === "flight" ? "✈️ Fly" : "🚌 Overnight bus/train"} · ~{r.fits[0].hours}h each way · ~{inr(r.fits[0].cost)} total
          </p>
        )}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {!locked && !solo && hasCard && (
            <button className={`btn ${myVote ? "bg-chili text-white" : "bg-white"}`} onClick={vote} disabled={busy}>{myVote ? "❤️ Your vote" : "🤍 Vote for this"}</button>
          )}
          {!locked && admin && !solo && (
            <button className="btn-sun" onClick={() => lock()} disabled={busy || !wkId}>🔒 Lock it in</button>
          )}
          <a className="btn-primary" href={gostopsUrl} target="_blank" rel="noreferrer" onClick={() => track("gostops_click", { dest: d.id })}>
            See beds at goSTOPS {d.name} →
          </a>
          {(locked || solo) && wk && (
            <a className="btn-ghost" target="_blank" rel="noreferrer" href={googleCal(`${d.name} trip (pakka)`, wk.startISO, wk.endISO, `${plan.name}\n${location.origin}/p/${plan.id}`)}>📅 Add to calendar</a>
          )}
          {(locked || solo) && (
            <a className="btn-ghost" href={`/p/${plan.id}/story`} target="_blank" rel="noreferrer" onClick={() => track("story_card")}>📸 Story card</a>
          )}
          {locked && admin && <button className="text-sm underline" onClick={() => lock(true)} disabled={busy}>unlock</button>}
        </div>
      </div>
    </article>
  );
}

function OrganiserLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <details className="mt-4 rounded-xl border-2 border-dashed border-ink/30 p-3 text-sm">
      <summary className="cursor-pointer font-semibold">🔑 Your organiser link (to lock the plan from another phone)</summary>
      <p className="mt-2 text-ink/60">Keep this one private. Anyone with it can lock the plan. Share the normal link with friends.</p>
      <button className="btn-ghost mt-2 w-full text-sm" onClick={async () => {
        try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
      }}>{copied ? "Copied ✓" : "Copy organiser link"}</button>
    </details>
  );
}

function shortRange(a: string, b: string) {
  const f = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
  const [sa, sb] = [f(a), f(b)];
  const sameMonth = a.slice(0, 7) === b.slice(0, 7);
  return sameMonth ? `${sa.split(" ")[0]}–${sb}` : `${sa} – ${sb}`;
}
