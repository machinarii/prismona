import { CODE_TTL_MS, generateCode, hashCode, normalizeEmail } from "@/lib/auth";
import { authConfigured, loadCode, placeholderMode, saveCode, secret, sendCodeEmail } from "@/lib/server/authstore";

// Step one of sign-in: email in, six-digit code out by email. Response is
// identical whether or not the address has an account — no enumeration.

export async function POST(req: Request): Promise<Response> {
  if (!authConfigured()) return Response.json({ error: "sign-in unavailable" }, { status: 503 });
  const body = await req.json().catch(() => null);
  const email = normalizeEmail(typeof body?.email === "string" ? body.email : "");
  if (!email) return Response.json({ error: "invalid email" }, { status: 400 });

  // Placeholder mode: nothing is emailed — the tester enters the fixed dev code.
  if (placeholderMode()) return Response.json({ ok: true, placeholder: true });

  const existing = await loadCode(email);
  if (existing && Date.now() < existing.resendAfter) {
    return Response.json({ error: "a code was just sent — check your inbox" }, { status: 429 });
  }

  const code = generateCode();
  await saveCode(email, {
    hash: hashCode(code, email, secret()),
    expiresAt: Date.now() + CODE_TTL_MS,
    attempts: 0,
    resendAfter: Date.now() + 60_000,
  });
  const sent = await sendCodeEmail(email, code);
  if (!sent) return Response.json({ error: "could not send email" }, { status: 502 });
  return Response.json({ ok: true });
}
