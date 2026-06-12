import { SESSION_COOKIE, sessionFrom } from "@/lib/server/authstore";

// GET: who am I (from the httpOnly cookie). DELETE: sign out.

export async function GET(req: Request): Promise<Response> {
  const session = sessionFrom(req);
  if (!session) return Response.json({ signedIn: false }, { status: 200 });
  return Response.json({ signedIn: true, email: session.email });
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
