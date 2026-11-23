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

export function track(event: string, extra: Record<string, string> = {}) {
  try {
    const body = JSON.stringify({ event, vid: getVid(), ...extra });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    else fetch("/api/track", { method: "POST", body, keepalive: true });
  } catch {}
}

export const inr = (n: number) => "₹" + (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : n);

export function whatsappLink(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
