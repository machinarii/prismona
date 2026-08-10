import { createHmac } from "crypto";
import { blob, blobConfigured } from "./blob";
import type { ObservationEntry } from "../observation";

// Behavioral observations, keyed pseudonymously by share code (HMAC — the code
// itself is never a path). Same possession-is-the-grant model as the field-notes
// store. Server-only. Storage backend (Postgres / Vercel) is abstracted in ./blob.

export const observeConfigured = () =>
  Boolean(blobConfigured() && process.env.AUTH_SECRET);

const codeKey = (canonicalCode: string) =>
  createHmac("sha256", process.env.AUTH_SECRET ?? "").update(canonicalCode).digest("base64url").slice(0, 24);

const MAX_ENTRIES = 400;

// Retention: the observed corpus self-limits. Entries older than this are pruned
// on each write (the ingest date is embedded in the key, so no read is needed).
// OBS_RETENTION_DAYS=0 disables the cap. Default 180 days.
const RETENTION_DAYS = Number(process.env.OBS_RETENTION_DAYS ?? 180);
const keyDate = (key: string): string | null => {
  const m = key.match(/\/(\d{4}-\d{2}-\d{2})\.json/);
  return m ? m[1] : null;
};

async function pruneOld(id: string): Promise<void> {
  if (!(RETENTION_DAYS > 0)) return;
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString().slice(0, 10);
  const refs = await blob.list(`obs/${id}/`, MAX_ENTRIES);
  await Promise.all(
    refs
      .filter((r) => { const d = keyDate(r.key); return d !== null && d < cutoff; })
      .map((r) => blob.del(r.key).catch(() => {})),
  );
}

export async function saveObservation(canonicalCode: string, entry: ObservationEntry): Promise<void> {
  const id = codeKey(canonicalCode);
  await blob.put(`obs/${id}/${entry.date}.json`, JSON.stringify(entry), { randomSuffix: true });
  await pruneOld(id);
}

export async function loadObservations(canonicalCode: string): Promise<ObservationEntry[]> {
  const refs = await blob.list(`obs/${codeKey(canonicalCode)}/`, MAX_ENTRIES);
  const entries = await Promise.all(
    refs.map(async (b) => {
      try {
        const text = await blob.get(b.key);
        return text ? (JSON.parse(text) as ObservationEntry) : null;
      } catch {
        return null;
      }
    }),
  );
  return entries.filter((e): e is ObservationEntry => Boolean(e && e.date));
}

export async function deleteObservations(canonicalCode: string): Promise<void> {
  const refs = await blob.list(`obs/${codeKey(canonicalCode)}/`, MAX_ENTRIES);
  await Promise.all(refs.map((b) => blob.del(b.key).catch(() => {})));
}

// Owner controls, stored under a separate prefix so they survive a "clear all"
// and aren't picked up by loadObservations. `enabled` is the local-first opt-in:
// the observed layer is OFF by default — nothing is stored until the owner turns
// it on. `paused` = agent ids whose submissions are dropped at ingest.
export interface ObsSettings { paused: string[]; enabled: boolean }
const DEFAULT_SETTINGS: ObsSettings = { paused: [], enabled: false };
const settingsPath = (canonicalCode: string) => `obsmeta/${codeKey(canonicalCode)}.json`;

export async function loadSettings(canonicalCode: string): Promise<ObsSettings> {
  try {
    const text = await blob.get(settingsPath(canonicalCode));
    if (!text) return { ...DEFAULT_SETTINGS };
    const s = JSON.parse(text) as Partial<ObsSettings>;
    return {
      paused: Array.isArray(s?.paused) ? s.paused.filter((x) => typeof x === "string") : [],
      enabled: Boolean(s?.enabled),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(canonicalCode: string, settings: ObsSettings): Promise<void> {
  await blob.put(
    settingsPath(canonicalCode),
    JSON.stringify({ paused: settings.paused.slice(0, 50), enabled: Boolean(settings.enabled) }),
  );
}
