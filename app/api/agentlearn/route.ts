import { decodeTeamCode } from "@/lib/agentteam";
import { decodeShareCode, encodeShareCode } from "@/lib/codec";
import { validateLearn, synthesizeLearn } from "@/lib/agentlearn";
import { agentLearnConfigured, deleteLearn, loadLearn, saveLearn } from "@/lib/server/agentlearnstore";

// Agent-learning endpoint: the report-back half of the learned-persona loop.
// Two identities, one store (keyed by a stable scope + slot):
//  • Team path (Composer): { teamCode, agentId } → scope = team's stable id, slot = agentId.
//  • Profile path (bridge): { code, role }       → scope = the owner's profile code, slot = role.
// Possession of the code is the grant, as with the observation endpoint.
// Keying by the stable team id (not the content code) means editing the roster
// and republishing preserves accumulated learning.

interface Ident { scope: string; slot: string }

function identity(teamCode: unknown, agentId: unknown, code: unknown, role: unknown): Ident | null {
  if (typeof teamCode === "string") {
    const team = decodeTeamCode(teamCode);
    const slot = typeof agentId === "string" && agentId.trim() ? agentId.trim().slice(0, 64) : null;
    if (team && slot) return { scope: team.id, slot };
  }
  if (typeof code === "string" && typeof role === "string" && role.trim()) {
    const share = decodeShareCode(code);
    if (share) return { scope: `p:${encodeShareCode(share)}`, slot: role.trim().slice(0, 64) };
  }
  return null;
}

const BAD_ID = "provide { teamCode, agentId } or { code, role }";

export async function POST(req: Request): Promise<Response> {
  if (!agentLearnConfigured()) return Response.json({ error: "learning paused" }, { status: 503 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const id = identity(body?.teamCode, body?.agentId, body?.code, body?.role);
  if (!id) return Response.json({ error: BAD_ID }, { status: 400 });
  const input = validateLearn(body);
  if (!input) return Response.json({ error: "provide worked and/or adjust tags (no personal info)" }, { status: 400 });
  await saveLearn(id.scope, id.slot, { date: new Date().toISOString().slice(0, 10), ...input });
  return Response.json({ ok: true });
}

export async function GET(req: Request): Promise<Response> {
  if (!agentLearnConfigured()) return Response.json({ error: "learning paused" }, { status: 503 });
  const q = new URL(req.url).searchParams;
  const id = identity(q.get("teamCode"), q.get("agentId"), q.get("code"), q.get("role"));
  if (!id) return Response.json({ error: BAD_ID }, { status: 400 });
  const overlay = synthesizeLearn(await loadLearn(id.scope, id.slot));
  return Response.json({ overlay });
}

export async function DELETE(req: Request): Promise<Response> {
  if (!agentLearnConfigured()) return Response.json({ error: "learning paused" }, { status: 503 });
  const q = new URL(req.url).searchParams;
  const id = identity(q.get("teamCode"), q.get("agentId"), q.get("code"), q.get("role"));
  if (!id) return Response.json({ error: BAD_ID }, { status: 400 });
  await deleteLearn(id.scope, id.slot);
  return Response.json({ ok: true });
}
