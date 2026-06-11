import { put } from "@vercel/blob";
import { normalizeCountry, validateContribution } from "@/lib/contrib";

// The only API route in the product, and deliberately narrow: it accepts an
// explicit opt-in contribution (share code + optional age band), attaches
// the coarse country from the edge geo header, and stores that JSON blob.
// No IP, no user agent, no cookies, no identifiers are read or stored.
// Assessment answers never reach this or any other endpoint.

export async function POST(req: Request): Promise<Response> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: "contributions paused" }, { status: 503 });
  }
  const body = await req.json().catch(() => null);
  const contribution = validateContribution(body);
  if (!contribution) {
    return Response.json({ error: "invalid contribution" }, { status: 400 });
  }
  const country = normalizeCountry(req.headers.get("x-vercel-ip-country"));
  const month = new Date().toISOString().slice(0, 7);
  await put(
    `contrib/${month}/${crypto.randomUUID()}.json`,
    JSON.stringify({
      v: 1,
      code: contribution.code,
      ageBand: contribution.ageBand ?? null,
      country,
      month, // coarse on purpose — no precise timestamp
    }),
    { access: "private", contentType: "application/json", addRandomSuffix: true },
  );
  return Response.json({ ok: true });
}
