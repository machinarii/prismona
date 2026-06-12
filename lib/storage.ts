import type { Profile, Snapshot, Tier } from "./types";
import { pushSnapshot, snapshotOf } from "./timeline";
import type { InterestProfile } from "./interests";
import { AGE_BANDS, type AgeBand } from "./contrib";

// Privacy by default: profiles live only in this browser's localStorage.
const key = (tier: Tier) => `prismona.profile.${tier}`;
const HISTORY_KEY = "prismona.history";
const INTERESTS_KEY = "prismona.interests";

export function saveProfile(p: Profile): void {
  try {
    localStorage.setItem(key(p.tier), JSON.stringify(p));
    localStorage.setItem("prismona.latest", p.tier);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(pushSnapshot(loadHistory(), snapshotOf(p))));
  } catch { /* storage unavailable (private mode etc.) — session-only */ }
}

export function loadHistory(): Snapshot[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const h = raw ? (JSON.parse(raw) as Snapshot[]) : [];
    return Array.isArray(h) ? h : [];
  } catch { return []; }
}

export function loadProfile(tier: Tier): Profile | null {
  try {
    const raw = localStorage.getItem(key(tier));
    if (!raw) return null;
    const p = JSON.parse(raw) as Profile;
    return p && p.v === 1 ? p : null;
  } catch { return null; }
}

export function loadLatest(): Profile | null {
  try {
    const latest = (localStorage.getItem("prismona.latest") as Tier | null) ?? "full";
    return loadProfile(latest) ?? loadProfile(latest === "full" ? "quick" : "full");
  } catch { return null; }
}

export function saveInterests(ip: InterestProfile): void {
  try { localStorage.setItem(INTERESTS_KEY, JSON.stringify(ip)); } catch { /* ignore */ }
}

export function loadInterests(): InterestProfile | null {
  try {
    const raw = localStorage.getItem(INTERESTS_KEY);
    if (!raw) return null;
    const ip = JSON.parse(raw) as InterestProfile;
    return ip && ip.v === 1 ? ip : null;
  } catch { return null; }
}

// Optional, local-only until the user explicitly contributes.
export function saveAgeBand(band: AgeBand | null): void {
  try {
    if (band) localStorage.setItem("prismona.ageBand", band);
    else localStorage.removeItem("prismona.ageBand");
  } catch { /* ignore */ }
}

export function loadAgeBand(): AgeBand | null {
  try {
    const v = localStorage.getItem("prismona.ageBand");
    return v && (AGE_BANDS as readonly string[]).includes(v) ? (v as AgeBand) : null;
  } catch { return null; }
}

// The desired self (Becoming tab) — local like everything else.
export function saveDesired(d: import("./aspire").DesiredSelf | null): void {
  try {
    if (d) localStorage.setItem("prismona.desired", JSON.stringify(d));
    else localStorage.removeItem("prismona.desired");
  } catch { /* ignore */ }
}

export function loadDesired(): import("./aspire").DesiredSelf | null {
  try {
    const raw = localStorage.getItem("prismona.desired");
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d && d.v === 1 && d.targets ? d : null;
  } catch { return null; }
}

// Observer codes from the informant mini-360 (kept as raw codes; max 3).
export function saveObserverCode(code: string): void {
  try {
    const list = loadObserverCodes().filter((c) => c !== code);
    list.push(code);
    localStorage.setItem("prismona.observers", JSON.stringify(list.slice(-3)));
  } catch { /* ignore */ }
}

export function loadObserverCodes(): string[] {
  try {
    const raw = localStorage.getItem("prismona.observers");
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

export function markContributed(code: string): void {
  try { localStorage.setItem(`prismona.contributed.${code}`, "1"); } catch { /* ignore */ }
}

export function hasContributed(code: string): boolean {
  try { return localStorage.getItem(`prismona.contributed.${code}`) === "1"; } catch { return false; }
}

export function clearProfiles(): void {
  try {
    localStorage.removeItem(key("quick"));
    localStorage.removeItem(key("full"));
    localStorage.removeItem("prismona.latest");
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(INTERESTS_KEY);
  } catch { /* ignore */ }
}
