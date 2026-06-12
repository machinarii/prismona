import { decodeShareCode, encodeShareCode } from "@/lib/codec";
import { digestFeedback, validateFeedback } from "@/lib/management";
import { feedbackConfigured, loadFeedback, saveFeedback } from "@/lib/server/feedbackstore";

// Collaboration field notes: agents (or humans) who hold a share code can
// report what worked and what didn't while working with its owner; the
// owner's AI tab shows the weekly digest. Pseudonymous, capped, never a
// performance record — input to a working style, not a file on a person.

const canonical = (code: unknown): string | null => {
  if (typeof code !== "string") return null;
  const decoded = decodeShareCode(code);
  return decoded ? encodeShareCode(decoded) : null;
};

export async function POST(req: Request): Promise<Response> {
  if (!feedbackConfigured()) return Response.json({ error: "field notes paused" }, { status: 503 });
  const body = await req.json().catch(() => null);
  const code = canonical(body?.code);
  if (!code) return Response.json({ error: "invalid share code" }, { status: 400 });
  const input = validateFeedback(body);
  if (!input) return Response.json({ error: "provide worked[] and/or didnt[] as short strings" }, { status: 400 });
  await saveFeedback(code, { date: new Date().toISOString().slice(0, 10), ...input });
  return Response.json({ ok: true });
}

export async function GET(req: Request): Promise<Response> {
  if (!feedbackConfigured()) return Response.json({ error: "field notes paused" }, { status: 503 });
  const code = canonical(new URL(req.url).searchParams.get("code"));
  if (!code) return Response.json({ error: "invalid share code" }, { status: 400 });
  const entries = await loadFeedback(code);
  return Response.json(digestFeedback(entries, new Date().toISOString().slice(0, 10)));
}
