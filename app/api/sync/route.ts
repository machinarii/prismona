import { deleteSyncedProfile, loadSyncedProfile, saveSyncedProfile, sessionFrom } from "@/lib/server/authstore";

// Profile sync — the one thing an account does, and only by explicit action.
// PUT saves this browser's profile bundle to the account (keyed by the session's
// pseudonymous account id); GET loads it on another device; DELETE removes it.
// Nothing syncs automatically.

const MAX_BYTES = 200_000;

export async function GET(req: Request): Promise<Response> {
  const session = sessionFrom(req);
  if (!session) return Response.json({ error: "not signed in" }, { status: 401 });
  const data = await loadSyncedProfile(session.acct);
  if (!data) return Response.json({ error: "nothing synced yet" }, { status: 404 });
  return Response.json(data);
}

export async function PUT(req: Request): Promise<Response> {
  const session = sessionFrom(req);
  if (!session) return Response.json({ error: "not signed in" }, { status: 401 });
  const text = await req.text();
  if (text.length > MAX_BYTES) return Response.json({ error: "too large" }, { status: 413 });
  let data: { v?: number; profile?: { v?: number } };
  try { data = JSON.parse(text); } catch { return Response.json({ error: "invalid JSON" }, { status: 400 }); }
  if (data?.v !== 1 || data?.profile?.v !== 1) return Response.json({ error: "invalid bundle" }, { status: 400 });
  await saveSyncedProfile(session.acct, data);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request): Promise<Response> {
  const session = sessionFrom(req);
  if (!session) return Response.json({ error: "not signed in" }, { status: 401 });
  await deleteSyncedProfile(session.acct);
  return Response.json({ ok: true });
}
