import type { Profile, Snapshot, Tier } from "./types";
import { pushSnapshot, snapshotOf } from "./timeline";
import { encodeShareCode } from "./codec";
import type { InterestProfile } from "./interests";
import { AGE_BANDS, CONTINENTS, type AgeBand, type Continent } from "./contrib";
import type { ValuesProfile } from "./values";

// Privacy by default: profiles live only in this browser's localStorage.
const key = (tier: Tier) => `prismona.profile.${tier}`;
const HISTORY_KEY = "prismona.history";
const INTERESTS_KEY = "prismona.interests";
const ARCHIVE_KEY = "prismona.archive";
const ARCHIVE_CAP = 12;
const VALUES_KEY = "prismona.values";

// Full prior results, kept in their entirety (not just snapshots) so a retake
// never loses a past blueprint. Deduped by share code — identical results
// merge, distinct ones (even same day) are all kept, capped at ARCHIVE_CAP.
export function loadArchive(): Profile[] {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    const a = raw ? (JSON.parse(raw) as Profile[]) : [];
    return Array.isArray(a) ? a.filter((p) => p && p.v === 1) : [];
  } catch { return []; }
}

function archiveProfile(p: Profile): void {
  try {
    const code = encodeShareCode(p);
    const kept = loadArchive().filter((q) => encodeShareCode(q) !== code);
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify([...kept, p].slice(-ARCHIVE_CAP)));
  } catch { /* ignore */ }
}

export function saveProfile(p: Profile): void {
  try {
    localStorage.setItem(key(p.tier), JSON.stringify(p));
    localStorage.setItem("prismona.latest", p.tier);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(pushSnapshot(loadHistory(), snapshotOf(p))));
    archiveProfile(p);
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

// Core values (Schwartz best-worst) — local like everything else.
export interface StoredValues { v: 1; date: string; profile: ValuesProfile }
export function saveValues(profile: ValuesProfile): void {
  try {
    localStorage.setItem(VALUES_KEY, JSON.stringify({ v: 1, date: new Date().toISOString().slice(0, 10), profile }));
  } catch { /* ignore */ }
}
export function loadValues(): StoredValues | null {
  try {
    const raw = localStorage.getItem(VALUES_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as StoredValues;
    return s && s.v === 1 && s.profile ? s : null;
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

export function saveContinent(c: Continent | null): void {
  try {
    if (c) localStorage.setItem("prismona.continent", c);
    else localStorage.removeItem("prismona.continent");
  } catch { /* ignore */ }
}

export function loadContinent(): Continent | null {
  try {
    const v = localStorage.getItem("prismona.continent");
    return v && (CONTINENTS as readonly string[]).includes(v) ? (v as Continent) : null;
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
    localStorage.removeItem(key("standard"));
    localStorage.removeItem(key("full"));
    localStorage.removeItem("prismona.latest");
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(INTERESTS_KEY);
    localStorage.removeItem(ARCHIVE_KEY);
    localStorage.removeItem(VALUES_KEY);
  } catch { /* ignore */ }
}
