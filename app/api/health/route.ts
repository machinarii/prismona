import { blob, blobConfigured } from "@/lib/server/blob";

// Liveness + storage readiness for the container healthcheck and the nginx
// upstream. Deliberately says nothing about *which* backend or where it lives —
// just whether the process is up and the store answers a read.

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  if (!blobConfigured()) return Response.json({ ok: true, storage: "unconfigured" });
  try {
    await blob.get("__health__");           // round-trips to Postgres; null is a fine answer
    return Response.json({ ok: true, storage: "ready" });
  } catch {
    return Response.json({ ok: false, storage: "error" }, { status: 503 });
  }
}
