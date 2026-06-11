import type { Profile, Snapshot, Tier } from "./types";
import { pushSnapshot, snapshotOf } from "./timeline";

// Privacy by default: profiles live only in this browser's localStorage.
const key = (tier: Tier) => `prismona.profile.${tier}`;
const HISTORY_KEY = "prismona.history";

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

export function clearProfiles(): void {
  try {
    localStorage.removeItem(key("quick"));
    localStorage.removeItem(key("full"));
    localStorage.removeItem("prismona.latest");
    localStorage.removeItem(HISTORY_KEY);
  } catch { /* ignore */ }
}
