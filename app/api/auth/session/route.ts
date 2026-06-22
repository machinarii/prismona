import { SESSION_COOKIE, authConfigured, sessionFrom } from "@/lib/server/authstore";

// GET: am I signed in (from the httpOnly cookie). DELETE: sign out.
// `enabled` is the feature flag: false when AUTH_SECRET isn't configured.
// No identity is returned — the session carries only a pseudonymous account id.

export async function GET(req: Request): Promise<Response> {
  return Response.json({ signedIn: Boolean(sessionFrom(req)), enabled: authConfigured() });
}

export async function DELETE(): Promise<Response> {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
    },
  });
}
