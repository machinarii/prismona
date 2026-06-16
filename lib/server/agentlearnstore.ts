import { createHmac } from "crypto";
import { blob, blobConfigured } from "./blob";
import type { AgentLearnEntry } from "../agentlearn";

// Per-agent learned signal, keyed pseudonymously by HMAC(teamCode:agentId).
// Same possession-is-the-grant model and PII posture as the observation store.
// Server-only. Storage backend abstracted in ./blob.

export const agentLearnConfigured = () =>
  Boolean(blobConfigured() && process.env.AUTH_SECRET);

const agentKey = (teamCode: string, agentId: string) =>
  createHmac("sha256", process.env.AUTH_SECRET ?? "")
    .update(`${teamCode}:${agentId}`)
    .digest("base64url")
    .slice(0, 24);

const MAX_ENTRIES = 200;

export async function saveLearn(teamCode: string, agentId: string, entry: AgentLearnEntry): Promise<void> {
  await blob.put(`agentlearn/${agentKey(teamCode, agentId)}/${entry.date}.json`, JSON.stringify(entry), { randomSuffix: true });
}

export async function loadLearn(teamCode: string, agentId: string): Promise<AgentLearnEntry[]> {
  const refs = await blob.list(`agentlearn/${agentKey(teamCode, agentId)}/`, MAX_ENTRIES);
  const entries = await Promise.all(
    refs.map(async (b) => {
      try {
        const text = await blob.get(b.key);
        return text ? (JSON.parse(text) as AgentLearnEntry) : null;
      } catch {
        return null;
      }
    }),
  );
  return entries.filter((e): e is AgentLearnEntry => Boolean(e && e.date));
}

export async function deleteLearn(teamCode: string, agentId: string): Promise<void> {
  const refs = await blob.list(`agentlearn/${agentKey(teamCode, agentId)}/`, MAX_ENTRIES);
  await Promise.all(refs.map((b) => blob.del(b.key).catch(() => {})));
}
