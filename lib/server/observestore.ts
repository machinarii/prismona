import { createHmac } from "crypto";
import { del, get, list, put } from "@vercel/blob";
import type { ObservationEntry } from "../observation";

// Behavioral observations, keyed pseudonymously by share code (HMAC — the code
// itself is never a path). Same possession-is-the-grant model as the field-notes
// store. Server-only.

export const observeConfigured = () =>
  Boolean(process.env.BLOB_READ_WRITE_TOKEN && process.env.AUTH_SECRET);

const codeKey = (canonicalCode: string) =>
  createHmac("sha256", process.env.AUTH_SECRET ?? "").update(canonicalCode).digest("base64url").slice(0, 24);

const MAX_ENTRIES = 400;

export async function saveObservation(canonicalCode: string, entry: ObservationEntry): Promise<void> {
  await put(`obs/${codeKey(canonicalCode)}/${entry.date}.json`, JSON.stringify(entry), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: true,
  });
}

export async function loadObservations(canonicalCode: string): Promise<ObservationEntry[]> {
  const { blobs } = await list({ prefix: `obs/${codeKey(canonicalCode)}/`, limit: MAX_ENTRIES });
  const entries = await Promise.all(
    blobs.map(async (b) => {
      try {
        const res = await get(b.pathname, { access: "private" });
        if (!res || res.statusCode !== 200) return null;
        return JSON.parse(await new Response(res.stream).text()) as ObservationEntry;
      } catch {
        return null;
      }
    }),
  );
  return entries.filter((e): e is ObservationEntry => Boolean(e && e.date));
}

export async function deleteObservations(canonicalCode: string): Promise<void> {
  const { blobs } = await list({ prefix: `obs/${codeKey(canonicalCode)}/`, limit: MAX_ENTRIES });
  await Promise.all(blobs.map((b) => del(b.url).catch(() => {})));
}

// Owner controls, stored under a separate prefix so they survive a "clear all"
// and aren't picked up by loadObservations. `paused` = agent ids whose
// submissions are dropped at ingest.
export interface ObsSettings { paused: string[] }
const settingsPath = (canonicalCode: string) => `obsmeta/${codeKey(canonicalCode)}.json`;

export async function loadSettings(canonicalCode: string): Promise<ObsSettings> {
  try {
    const res = await get(settingsPath(canonicalCode), { access: "private" });
    if (!res || res.statusCode !== 200) return { paused: [] };
    const s = JSON.parse(await new Response(res.stream).text()) as ObsSettings;
    return { paused: Array.isArray(s?.paused) ? s.paused.filter((x) => typeof x === "string") : [] };
  } catch {
    return { paused: [] };
  }
}

export async function saveSettings(canonicalCode: string, settings: ObsSettings): Promise<void> {
  await put(settingsPath(canonicalCode), JSON.stringify({ paused: settings.paused.slice(0, 50) }), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}
