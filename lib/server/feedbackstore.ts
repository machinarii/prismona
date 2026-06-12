import { createHmac } from "crypto";
import { get, list, put } from "@vercel/blob";
import type { FeedbackEntry } from "../management";

// Collaboration field notes, keyed pseudonymously by share code (HMAC — the
// code itself is not stored as a path). Whoever holds the code can write
// observations and read the digest; possession is the grant, exactly as with
// every other code-bearing surface.

export const feedbackConfigured = () =>
  Boolean(process.env.BLOB_READ_WRITE_TOKEN && process.env.AUTH_SECRET);

const codeKey = (canonicalCode: string) =>
  createHmac("sha256", process.env.AUTH_SECRET ?? "").update(canonicalCode).digest("base64url").slice(0, 24);

const MAX_ENTRIES = 200;

export async function saveFeedback(canonicalCode: string, entry: FeedbackEntry): Promise<void> {
  await put(`mgmt/${codeKey(canonicalCode)}/${entry.date}.json`, JSON.stringify(entry), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: true,
  });
}

export async function loadFeedback(canonicalCode: string): Promise<FeedbackEntry[]> {
  const { blobs } = await list({ prefix: `mgmt/${codeKey(canonicalCode)}/`, limit: MAX_ENTRIES });
  const entries = await Promise.all(
    blobs.map(async (b) => {
      try {
        const res = await get(b.pathname, { access: "private" });
        if (!res || res.statusCode !== 200) return null;
        return JSON.parse(await new Response(res.stream).text()) as FeedbackEntry;
      } catch {
        return null;
      }
    }),
  );
  return entries.filter((e): e is FeedbackEntry => Boolean(e && e.date));
}
