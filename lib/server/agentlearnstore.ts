import { createHmac } from "crypto";
import { del, get, list, put } from "@vercel/blob";
import type { AgentLearnEntry } from "../agentlearn";

// Per-agent learned signal, keyed pseudonymously by HMAC(teamCode:agentId).
// Same possession-is-the-grant model and PII posture as the observation store.
// Server-only. Stores qualitative interaction reports, never trait scores.

export const agentLearnConfigured = () =>
  Boolean(process.env.BLOB_READ_WRITE_TOKEN && process.env.AUTH_SECRET);

const agentKey = (teamCode: string, agentId: string) =>
  createHmac("sha256", process.env.AUTH_SECRET ?? "")
    .update(`${teamCode}:${agentId}`)
    .digest("base64url")
    .slice(0, 24);

const MAX_ENTRIES = 200;

export async function saveLearn(teamCode: string, agentId: string, entry: AgentLearnEntry): Promise<void> {
  await put(`agentlearn/${agentKey(teamCode, agentId)}/${entry.date}.json`, JSON.stringify(entry), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: true,
  });
}

export async function loadLearn(teamCode: string, agentId: string): Promise<AgentLearnEntry[]> {
  const { blobs } = await list({ prefix: `agentlearn/${agentKey(teamCode, agentId)}/`, limit: MAX_ENTRIES });
  const entries = await Promise.all(
    blobs.map(async (b) => {
      try {
        const res = await get(b.pathname, { access: "private" });
        if (!res || res.statusCode !== 200) return null;
        return JSON.parse(await new Response(res.stream).text()) as AgentLearnEntry;
      } catch {
        return null;
      }
    }),
  );
  return entries.filter((e): e is AgentLearnEntry => Boolean(e && e.date));
}

export async function deleteLearn(teamCode: string, agentId: string): Promise<void> {
  const { blobs } = await list({ prefix: `agentlearn/${agentKey(teamCode, agentId)}/`, limit: MAX_ENTRIES });
  await Promise.all(blobs.map((b) => del(b.url).catch(() => {})));
}
