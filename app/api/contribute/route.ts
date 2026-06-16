import { blob, blobConfigured } from "@/lib/server/blob";
import { normalizeCountry, validateContribution } from "@/lib/contrib";

// The only API route in the product, and deliberately narrow: it accepts an
// explicit opt-in contribution (share code + optional age band), attaches
// the coarse country from the edge geo header, and stores that JSON blob.
// No IP, no user agent, no cookies, no identifiers are read or stored.
// Assessment answers never reach this or any other endpoint.

export async function POST(req: Request): Promise<Response> {
  if (!blobConfigured()) {
    return Response.json({ error: "contributions paused" }, { status: 503 });
  }
  const body = await req.json().catch(() => null);
  const contribution = validateContribution(body);
  if (!contribution) {
    return Response.json({ error: "invalid contribution" }, { status: 400 });
  }
  // Coarse country from the host's edge geo header (Vercel: x-vercel-ip-country;
  // null on other hosts → "unknown"). No IP, agent, or cookie is read or stored.
  const country = normalizeCountry(
    req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry"),
  );
  const month = new Date().toISOString().slice(0, 7);
  await blob.put(
    `contrib/${month}/${crypto.randomUUID()}.json`,
    JSON.stringify({
      v: 1,
      code: contribution.code,
      ageBand: contribution.ageBand ?? null,
      country,
      month, // coarse on purpose — no precise timestamp
    }),
    { randomSuffix: true },
  );
  return Response.json({ ok: true });
}
