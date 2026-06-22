import { decodeShareCode, encodeShareCode } from "@/lib/codec";
import { validateObservation } from "@/lib/observation";
import { synthesizeObservations } from "@/lib/observed";
import { deleteObservations, loadObservations, loadSettings, observeConfigured, saveObservation, saveSettings } from "@/lib/server/observestore";

// Behavioral observations from agents — the daily "observed" layer of the
// continuous-tuning loop. Strict behavioral schema, PII-filtered in
// validateObservation. Possession of the share code is the grant, exactly as
// with field notes. These never change the owner's measured trait scores.

const canonical = (code: unknown): string | null => {
  if (typeof code !== "string") return null;
  const decoded = decodeShareCode(code);
  return decoded ? encodeShareCode(decoded) : null;
};

export async function POST(req: Request): Promise<Response> {
  if (!observeConfigured()) return Response.json({ error: "observations paused" }, { status: 503 });
  const body = await req.json().catch(() => null);
  const code = canonical((body as Record<string, unknown> | null)?.code);
  if (!code) return Response.json({ error: "invalid share code" }, { status: 400 });
  const input = validateObservation(body);
  if (!input) return Response.json({ error: "provide behavioral tags and/or notes (no personal info)" }, { status: 400 });
  // Local-first opt-in: nothing is stored unless the owner has enabled the layer.
  const settings = await loadSettings(code);
  if (!settings.enabled) {
    return Response.json({ ok: true, note: "the owner hasn't enabled the observed layer — not recorded" });
  }
  if (input.agent && settings.paused.includes(input.agent)) {
    return Response.json({ ok: true, note: "this agent is paused by the owner — not recorded" });
  }
  await saveObservation(code, { date: new Date().toISOString().slice(0, 10), ...input });
  return Response.json({ ok: true });
}

export async function GET(req: Request): Promise<Response> {
  if (!observeConfigured()) return Response.json({ error: "observations paused" }, { status: 503 });
  const code = canonical(new URL(req.url).searchParams.get("code"));
  if (!code) return Response.json({ error: "invalid share code" }, { status: 400 });
  const settings = await loadSettings(code);
  const entries = settings.enabled ? await loadObservations(code) : [];
  const agentIds = [...new Set(entries.map((e) => e.agent).filter((a): a is string => Boolean(a)))];
  return Response.json({
    overlay: synthesizeObservations(entries),
    count: entries.length,
    agentIds,
    paused: settings.paused,
    enabled: settings.enabled,
  });
}

export async function DELETE(req: Request): Promise<Response> {
  if (!observeConfigured()) return Response.json({ error: "observations paused" }, { status: 503 });
  const code = canonical(new URL(req.url).searchParams.get("code"));
  if (!code) return Response.json({ error: "invalid share code" }, { status: 400 });
  await deleteObservations(code);
  return Response.json({ ok: true });
}

// Owner controls: the local-first opt-in (`enabled`) and the list of paused
// agent ids. Both are merged onto existing settings; omit a field to leave it.
export async function PATCH(req: Request): Promise<Response> {
  if (!observeConfigured()) return Response.json({ error: "observations paused" }, { status: 503 });
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const code = canonical(body?.code);
  if (!code) return Response.json({ error: "invalid share code" }, { status: 400 });
  const current = await loadSettings(code);
  const paused = Array.isArray(body?.paused)
    ? (body!.paused as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 50)
    : current.paused;
  const enabled = typeof body?.enabled === "boolean" ? body!.enabled : current.enabled;
  await saveSettings(code, { paused, enabled });
  return Response.json({ ok: true, paused, enabled });
}
