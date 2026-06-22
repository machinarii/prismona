import { signSession } from "@/lib/auth";
import { normalizeAccountKey } from "@/lib/account";
import { SESSION_COOKIE, acctIdFor, authConfigured, secret } from "@/lib/server/authstore";

// Sign in by recovery key: paste a PRSM-ACCT-… key → httpOnly session cookie.
// No email, no code round-trip. The key is validated and turned into a
// pseudonymous accountId; the raw key is never stored or logged. Creating an
// account and restoring one are the same act — possession of the key is the
// account. See docs/research/PRIVACY-AND-ANONYMITY.md.

export async function POST(req: Request): Promise<Response> {
  if (!authConfigured()) return Response.json({ error: "sign-in unavailable" }, { status: 503 });
  const body = await req.json().catch(() => null);
  const key = normalizeAccountKey((body as Record<string, unknown> | null)?.key);
  if (!key) return Response.json({ error: "invalid account key" }, { status: 400 });

  const token = signSession(acctIdFor(key), secret());
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`,
    },
  });
}
