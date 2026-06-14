import { decodeTeamCode } from "@/lib/agentteam";
import { validateLearn, synthesizeLearn } from "@/lib/agentlearn";
import { agentLearnConfigured, deleteLearn, loadLearn, saveLearn } from "@/lib/server/agentlearnstore";

// Agent-learning endpoint: the report-back half of the learned-persona loop.
// An agent that worked with the team owner reports what landed and what to
// adjust; the owner can read the synthesized overlay and reset it. Possession
// of the PRSM-TEAM- code is the grant, as with the observation endpoint.

const validTeam = (code: unknown): string | null =>
  typeof code === "string" && decodeTeamCode(code) ? code.trim() : null;

const agentOf = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, 64) : null;

export async function POST(req: Request): Promise<Response> {
  if (!agentLearnConfigured()) return Response.json({ error: "learning paused" }, { status: 503 });
  const body = await req.json().catch(() => null);
  const teamCode = validTeam((body as Record<string, unknown> | null)?.teamCode);
  const agentId = agentOf((body as Record<string, unknown> | null)?.agentId);
  if (!teamCode || !agentId) return Response.json({ error: "teamCode and agentId required" }, { status: 400 });
  const input = validateLearn(body);
  if (!input) return Response.json({ error: "provide worked and/or adjust tags (no personal info)" }, { status: 400 });
  await saveLearn(teamCode, agentId, { date: new Date().toISOString().slice(0, 10), ...input });
  return Response.json({ ok: true });
}

export async function GET(req: Request): Promise<Response> {
  if (!agentLearnConfigured()) return Response.json({ error: "learning paused" }, { status: 503 });
  const url = new URL(req.url);
  const teamCode = validTeam(url.searchParams.get("teamCode"));
  const agentId = agentOf(url.searchParams.get("agentId"));
  if (!teamCode || !agentId) return Response.json({ error: "teamCode and agentId required" }, { status: 400 });
  const overlay = synthesizeLearn(await loadLearn(teamCode, agentId));
  return Response.json({ overlay });
}

export async function DELETE(req: Request): Promise<Response> {
  if (!agentLearnConfigured()) return Response.json({ error: "learning paused" }, { status: 503 });
  const url = new URL(req.url);
  const teamCode = validTeam(url.searchParams.get("teamCode"));
  const agentId = agentOf(url.searchParams.get("agentId"));
  if (!teamCode || !agentId) return Response.json({ error: "teamCode and agentId required" }, { status: 400 });
  await deleteLearn(teamCode, agentId);
  return Response.json({ ok: true });
}
