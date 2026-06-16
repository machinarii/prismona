import { createHmac } from "crypto";
import { blob, blobConfigured } from "./blob";
import type { FeedbackEntry } from "../management";

// Collaboration field notes, keyed pseudonymously by share code (HMAC — the
// code itself is not stored as a path). Whoever holds the code can write
// observations and read the digest; possession is the grant, exactly as with
// every other code-bearing surface. Storage backend abstracted in ./blob.

export const feedbackConfigured = () =>
  Boolean(blobConfigured() && process.env.AUTH_SECRET);

const codeKey = (canonicalCode: string) =>
  createHmac("sha256", process.env.AUTH_SECRET ?? "").update(canonicalCode).digest("base64url").slice(0, 24);

const MAX_ENTRIES = 200;

export async function saveFeedback(canonicalCode: string, entry: FeedbackEntry): Promise<void> {
  await blob.put(`mgmt/${codeKey(canonicalCode)}/${entry.date}.json`, JSON.stringify(entry), { randomSuffix: true });
}

export async function loadFeedback(canonicalCode: string): Promise<FeedbackEntry[]> {
  const refs = await blob.list(`mgmt/${codeKey(canonicalCode)}/`, MAX_ENTRIES);
  const entries = await Promise.all(
    refs.map(async (b) => {
      try {
        const text = await blob.get(b.key);
        return text ? (JSON.parse(text) as FeedbackEntry) : null;
      } catch {
        return null;
      }
    }),
  );
  return entries.filter((e): e is FeedbackEntry => Boolean(e && e.date));
}
