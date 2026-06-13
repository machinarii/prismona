import { normalizeEmail, signSession, verifyCode } from "@/lib/auth";
import { authConfigured, deleteCode, devCode, ensureAccount, loadCode, placeholderMode, saveCode, secret } from "@/lib/server/authstore";

// Step two: email + code in, httpOnly session cookie out. Codes burn on
// success and on the fifth failed attempt.

const COOKIE = "prismona_session";

export async function POST(req: Request): Promise<Response> {
  if (!authConfigured()) return Response.json({ error: "sign-in unavailable" }, { status: 503 });
  const body = await req.json().catch(() => null);
  const email = normalizeEmail(typeof body?.email === "string" ? body.email : "");
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!email || !/^\d{6}$/.test(code)) return Response.json({ error: "invalid request" }, { status: 400 });

  // Placeholder mode: accept the fixed dev code, sign in, skip Blob storage.
  if (placeholderMode()) {
    if (code !== devCode()) return Response.json({ error: "wrong or expired code" }, { status: 401 });
    if (process.env.BLOB_READ_WRITE_TOKEN) await ensureAccount(email);
    const token = signSession(email, secret());
    return new Response(JSON.stringify({ ok: true, email }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`,
      },
    });
  }

  const record = await loadCode(email);
  if (!record) return Response.json({ error: "no active code — request a new one" }, { status: 400 });

  if (!verifyCode(code, email, record, secret())) {
    await saveCode(email, { ...record, attempts: record.attempts + 1 });
    return Response.json({ error: "wrong or expired code" }, { status: 401 });
  }

  await deleteCode(email);
  await ensureAccount(email);
  const token = signSession(email, secret());
  return new Response(JSON.stringify({ ok: true, email }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`,
    },
  });
}
