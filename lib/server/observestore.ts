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

export async function saveObservation(canonicalCode: string, entry: ObservationEntry): Promise<void> {
  await blob.put(`obs/${codeKey(canonicalCode)}/${entry.date}.json`, JSON.stringify(entry), { randomSuffix: true });
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
// and aren't picked up by loadObservations. `paused` = agent ids whose
// submissions are dropped at ingest.
export interface ObsSettings { paused: string[] }
const settingsPath = (canonicalCode: string) => `obsmeta/${codeKey(canonicalCode)}.json`;

export async function loadSettings(canonicalCode: string): Promise<ObsSettings> {
  try {
    const text = await blob.get(settingsPath(canonicalCode));
    if (!text) return { paused: [] };
    const s = JSON.parse(text) as ObsSettings;
    return { paused: Array.isArray(s?.paused) ? s.paused.filter((x) => typeof x === "string") : [] };
  } catch {
    return { paused: [] };
  }
}

export async function saveSettings(canonicalCode: string, settings: ObsSettings): Promise<void> {
  await blob.put(settingsPath(canonicalCode), JSON.stringify({ paused: settings.paused.slice(0, 50) }));
}
