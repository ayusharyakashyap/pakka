"use client";

const safe = <T,>(fn: () => T, fallback: T): T => {
  try { return fn(); } catch { return fallback; }
};
const rid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function getVid(): string {
  return safe(() => {
    let v = localStorage.getItem("pakka_vid");
    if (!v) { v = rid(); localStorage.setItem("pakka_vid", v); }
    return v;
  }, "anon");
}

export function memberIdFor(planId: string): string {
  return safe(() => {
    const k = `pakka_m_${planId}`;
    let v = localStorage.getItem(k);
    if (!v) { v = rid(); localStorage.setItem(k, v); }
    return v;
  }, rid());
}

export const getAdmin = (planId: string) => safe(() => localStorage.getItem(`pakka_a_${planId}`), null);
export const setAdmin = (planId: string, t: string) => safe(() => localStorage.setItem(`pakka_a_${planId}`, t), undefined);

export function getSrc(): string | undefined {
  return safe(() => {
    const p = new URLSearchParams(location.search);
    return p.get("utm_source") || p.get("src") || (document.referrer ? new URL(document.referrer).hostname : undefined) || undefined;
  }, undefined);
}

/** Builder's own devices: open the site once with ?team=1 to exclude this device from all numbers (?team=0 to undo). */
export function syncTeamFlag() {
  safe(() => {
    const t = new URLSearchParams(location.search).get("team");
    if (t === "1") localStorage.setItem("pakka_team", "1");
    if (t === "0") localStorage.removeItem("pakka_team");
  }, undefined);
}
export const isTeamDevice = () => safe(() => localStorage.getItem("pakka_team") === "1", false);

/** POST JSON and never throw: network errors and non-JSON responses become a friendly error. */
export async function postJSON<T>(url: string, body: Record<string, unknown>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, team: isTeamDevice() }),
    });
    const data = await r.json().catch(() => null);
    if (!r.ok || !data) return { ok: false, error: (data && data.error) || "Something went wrong. Try again?" };
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "No internet? Check your connection and try again." };
  }
}

export function track(event: string, extra: Record<string, string> = {}) {
  try {
    if (isTeamDevice()) return;
    const body = JSON.stringify({ event, vid: getVid(), ...extra });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    else fetch("/api/track", { method: "POST", body, keepalive: true });
  } catch {}
}

export const inr = (n: number) => "₹" + (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : n);

export function whatsappLink(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
