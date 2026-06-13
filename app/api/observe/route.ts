import { decodeShareCode, encodeShareCode } from "@/lib/codec";
import { validateObservation } from "@/lib/observation";
import { synthesizeObservations } from "@/lib/observed";
import { deleteObservations, loadObservations, observeConfigured, saveObservation } from "@/lib/server/observestore";

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
  await saveObservation(code, { date: new Date().toISOString().slice(0, 10), ...input });
  return Response.json({ ok: true });
}

export async function GET(req: Request): Promise<Response> {
  if (!observeConfigured()) return Response.json({ error: "observations paused" }, { status: 503 });
  const code = canonical(new URL(req.url).searchParams.get("code"));
  if (!code) return Response.json({ error: "invalid share code" }, { status: 400 });
  const entries = await loadObservations(code);
  return Response.json({ overlay: synthesizeObservations(entries), count: entries.length });
}

export async function DELETE(req: Request): Promise<Response> {
  if (!observeConfigured()) return Response.json({ error: "observations paused" }, { status: 503 });
  const code = canonical(new URL(req.url).searchParams.get("code"));
  if (!code) return Response.json({ error: "invalid share code" }, { status: 400 });
  await deleteObservations(code);
  return Response.json({ ok: true });
}
