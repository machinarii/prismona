# Migration — Vercel → DigitalOcean (Postgres)

_Runbook for moving Prismona off Vercel to DigitalOcean App Platform + DigitalOcean Managed **Postgres**. The app is a Next.js 15 App Router project; the storage and URL couplings are now **abstracted in-repo**, so migrating is mostly **configuration**._

## Status

| Piece | State |
|---|---|
| **Storage abstraction** (`lib/server/blob.ts`) | ✅ **Built.** `BlobStore` interface with a **Postgres** backend (primary) and a **Vercel Blob** backend (fallback). Picks by env: `DATABASE_URL` → Postgres, else `BLOB_READ_WRITE_TOKEN` → Vercel, else unconfigured (features 503). The four stores + the contribute route use it; no file imports `@vercel/blob` except the fallback in `blob.ts`. |
| **Hardcoded URLs** | ✅ **Built.** `lib/mcptools.ts` uses `PRISMONA_BASE_URL` (falls back to the Vercel URL). |
| **Hosting / DB / DNS** | ⏳ The remaining work — config + DO setup below. |

Because the abstraction picks Postgres whenever `DATABASE_URL` is set, you can flip storage to Postgres **on the existing Vercel deploy first** (Vercel compute + DO Postgres), verify, then move compute to DO — a safe, incremental cutover.

## What's still coupled to Vercel

| Coupling | Where | Replacement |
|---|---|---|
| **`@vercel/blob`** (fallback only) | `lib/server/blob.ts` | already abstracted — remove the dep once fully on Postgres |
| **`x-vercel-ip-country`** geo header | `app/api/contribute/route.ts` | falls back to `cf-ipcountry` (Cloudflare) → `"unknown"`; harmless |
| **SSO Deployment Protection** (the 401 preview gate) | Vercel project setting | app's own email auth, or a basic-auth `middleware.ts` |
| **`vercel deploy` / `vercel alias`** | deploy flow | DO App Platform git deploys (or `doctl apps`) |

Not used (nothing to migrate): Vercel KV, Vercel Postgres, Edge Functions, ISR.

---

## Step 1 — Provision DO Managed Postgres (storage)

1. DO → **Databases → Create → PostgreSQL** (a basic single node is fine to start, ~$15/mo).
2. Grab the **connection string** (the `postgresql://…?sslmode=require` URL).
3. Set env on the app (Vercel now, DO later): `DATABASE_URL=<that string>`.

That's it — the `blobs(key text primary key, body jsonb, created_at)` table **auto-creates** on first write (`lib/server/blob.ts` runs `create table if not exists`). The abstraction switches to Postgres automatically when `DATABASE_URL` is present.

- SSL: the backend uses `ssl: { rejectUnauthorized: false }` by default (accepts DO's cert). For stricter verification, supply the CA cert and adjust; set `DATABASE_SSL=off` only for a local non-TLS Postgres.
- Pooling: `PG_POOL_MAX` (default 5). App Platform instances are long-lived, so a small pool per instance is fine; raise instance count rather than pool size for throughput.

**Migrating existing data (optional).** Auth accounts + observations/feedback/learned blobs live in Vercel Blob today and do **not** auto-copy. If you need them, run a one-off: list each Vercel blob, read it, `insert into blobs(key, body)` with the same key (strip any random suffix Vercel added, or keep it — keys only need to stay unique under their prefix). Everything else is client-side localStorage and needs no migration.

## Step 2 — Set `PRISMONA_BASE_URL`

Set `PRISMONA_BASE_URL=https://prismona.io` (or the DO staging URL). This points the MCP tools' internal API calls at the right host. Also update the schema URL in `lib/export.ts` and the doc links in `lib/mcpguide.ts` to the new domain (cosmetic, but do it so the JSON schema + agent links resolve).

## Step 3 — Stand up DO App Platform

App Platform runs Next.js natively (git deploys). Minimal `app.yaml`:

```yaml
name: prismona
region: nyc
services:
  - name: web
    github:
      repo: machinarii/prismona
      branch: main          # or qa
      deploy_on_push: true
    build_command: npm run build
    run_command: npm start
    environment_slug: node-js
    instance_size_slug: basic-xxs
    http_port: 3000
    routes:
      - path: /
    envs:
      - { key: DATABASE_URL,      scope: RUN_TIME, type: SECRET }
      - { key: AUTH_SECRET,       scope: RUN_TIME, type: SECRET }
      - { key: RESEND_API_KEY,    scope: RUN_TIME, type: SECRET }
      - { key: PRISMONA_BASE_URL, scope: RUN_TIME, value: https://prismona.io }
```

`doctl apps create --spec app.yaml` (or paste in the dashboard). Ensure `package.json` has `"start": "next start -p 3000"`. You can attach the Managed Postgres as a DO "database" component instead of a raw `DATABASE_URL` secret if you keep both in the same DO project.

*Alternative — Droplet + Docker:* set `output: "standalone"` in `next.config.mjs`, build a `node:20-slim` image copying `.next/standalone`, run behind nginx with systemd/pm2. More control, more ops; App Platform is the closer Vercel analog.

## Step 4 — Environment variables

- `DATABASE_URL` (DO Postgres) · `AUTH_SECRET` (carry over — keeps existing HMAC keys/codes valid) · `RESEND_API_KEY` · `PRISMONA_BASE_URL`
- Optional: `AUTH_DEV_CODE` (placeholder login), `EMAIL_FROM`, `PG_POOL_MAX`, `DATABASE_SSL`
- You can drop `BLOB_READ_WRITE_TOKEN` once you're fully on Postgres (then remove `@vercel/blob` from `package.json` + the fallback in `blob.ts`).

## Step 5 — Replace the SSO preview gate

Vercel Deployment Protection (the 401 on qa) is gone on DO. Options:
- **Nothing** — rely on the app's email sign-in for gated areas.
- **Basic-auth `middleware.ts`** for a staging lock (keep `/api/mcp` open):

```ts
import { NextResponse, type NextRequest } from "next/server";
export function middleware(req: NextRequest) {
  if (!process.env.BASIC_AUTH_USER) return NextResponse.next();
  const expected = "Basic " + btoa(`${process.env.BASIC_AUTH_USER}:${process.env.BASIC_AUTH_PASS}`);
  if (req.headers.get("authorization") !== expected) {
    return new NextResponse("Auth required", { status: 401, headers: { "WWW-Authenticate": "Basic" } });
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next|favicon|api/mcp).*)"] };
```

## Step 6 — DNS cutover (Porkbun → DO)

1. In the DO app, add `prismona.io` (+ `www`) as custom domains; DO issues a Let's Encrypt cert.
2. Update DNS at Porkbun per DO's instructions (an `A`/`ALIAS` to the app, or move nameservers to DO). Optionally put **Cloudflare** in front for a global CDN + caching (App Platform serves from one region).
3. Verify the app, the MCP endpoint (`/api/mcp`), and auth on the new domain **before** removing the Vercel domain.

## Step 7 — Decommission Vercel

After verification: remove the domain from Vercel, delete the project, drop `BLOB_READ_WRITE_TOKEN`, and `npm rm @vercel/blob` (then delete the `vercelStore` block in `blob.ts`).

---

## Suggested order (incremental, low-risk)

1. **Provision DO Postgres → set `DATABASE_URL` on the *current Vercel* deploy.** Storage flips to Postgres; verify auth/observe/feedback/learned still work (Vercel compute + DO DB).
2. Set `PRISMONA_BASE_URL`.
3. Stand up the DO App Platform app (Steps 3–4), deploy to a DO staging URL, verify.
4. Add the gate (Step 5), cut over DNS (Step 6), decommission Vercel (Step 7).

## Caveats

- **`randomSuffix`**: Vercel auto-uniquified keys; the Postgres backend appends `.{uuid}` itself. Stores enumerate by `list(prefix)`, so this is transparent.
- **MCP endpoint URL changes** (`…vercel.app/api/mcp` → `prismona.io/api/mcp`): re-share with connected agents; existing share codes are unaffected (self-contained).
- **Why Postgres over Spaces:** the data is small structured JSON, not large files — so object storage's one advantage doesn't apply, and `jsonb` keeps the corpus queryable for re-norming/analytics (PRD §6) that object storage can't do.
