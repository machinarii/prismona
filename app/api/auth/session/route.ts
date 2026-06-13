import { SESSION_COOKIE, authConfigured, sessionFrom } from "@/lib/server/authstore";

// GET: who am I (from the httpOnly cookie). DELETE: sign out.
// `enabled` is the feature flag: false when the auth secrets aren't configured,
// which keeps the login gate transparent so test-taking still works.

export async function GET(req: Request): Promise<Response> {
  const enabled = authConfigured();
  const session = sessionFrom(req);
  if (!session) return Response.json({ signedIn: false, enabled }, { status: 200 });
  return Response.json({ signedIn: true, email: session.email, enabled });
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
