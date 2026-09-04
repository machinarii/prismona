# Migration — Vercel → DigitalOcean (self-hosted Postgres)

_Runbook for moving Prismona off Vercel onto a **DigitalOcean droplet**, running as a container beside a **self-hosted Postgres 16** in Docker on the same host. The app is a Next.js 15 App Router project; the storage and URL couplings are **abstracted in-repo**, so migrating is mostly **configuration**._

> **Changed 2026-09-01.** This used to target DO **App Platform** + a **managed** Postgres cluster (`prismona-db`, ~$15/mo). Both are retired: the database is now a Postgres container on a droplet we already run, backed up nightly with `pg_dump` → object storage. The managed cluster costs nothing to keep around during verification but is meant to be destroyed. `.do/app.yaml` is deleted — App Platform can't reach a database bound to `127.0.0.1`, so compute had to move onto the same host.

## Status

| Piece | State |
|---|---|
| **Storage abstraction** (`lib/server/blob.ts`) | ✅ **Built.** `BlobStore` interface with a **Postgres** backend (primary) and a **Vercel Blob** backend (fallback). Picks by env: `DATABASE_URL` → Postgres, else `BLOB_READ_WRITE_TOKEN` → Vercel, else unconfigured (features 503). The four stores + the contribute route use it; no file imports `@vercel/blob` except the fallback in `blob.ts`. |
| **Hardcoded URLs** | ✅ **Built.** `lib/mcptools.ts` uses `PRISMONA_BASE_URL` (falls back to the Vercel URL). |
| **Deploy artifacts** | ✅ **Built.** `Dockerfile` + `.dockerignore`, `output: "standalone"` in `next.config.mjs`, `docker-compose.yml` (joins the Postgres stack's network), `deploy/deploy.sh`, `/api/health`. |
| **Database** | ✅ **Self-hosted.** Postgres 16 container at `/opt/postgres` on the droplet, `127.0.0.1:5432` only, nightly `pg_dump -Fc` → rclone → object storage. |
| **DNS** | ⏳ The remaining work — point `prismona.io` at the droplet and issue a cert (Step 5). |

## What's still coupled to Vercel

| Coupling | Where | Replacement |
|---|---|---|
| **`@vercel/blob`** (fallback only) | `lib/server/blob.ts` | already abstracted — remove the dep once fully on Postgres |
| **`x-vercel-ip-country`** geo header | `app/api/contribute/route.ts` | falls back to `cf-ipcountry` (Cloudflare) → `"unknown"`; harmless |
| **SSO Deployment Protection** (the 401 preview gate) | Vercel project setting | app's own auth, or a basic-auth `middleware.ts` (Step 4) |
| **`vercel deploy` / `vercel alias`** | deploy flow | `deploy/deploy.sh` (rsync + `docker compose up -d --build`) |

Not used (nothing to migrate): Vercel KV, Vercel Postgres, Edge Functions, ISR.

---

## Step 1 — The database (self-hosted Postgres)

The droplet runs a general-purpose Postgres 16 container at `/opt/postgres`, bound to `127.0.0.1:5432` and reachable from other containers on the `postgres_default` network as hostname `postgres`. Prismona gets its **own role and database** rather than sharing the cluster-wide `app` database — `deploy/deploy.sh` creates them on first run:

```sql
create role prismona login password '<generated>';
create database prismona owner prismona;
```

`DATABASE_URL=postgresql://prismona:<pw>@postgres:5432/prismona` with `DATABASE_SSL=off` (the link is a private docker network, not the internet). The `blobs(key text primary key, body jsonb, created_at)` table **auto-creates on first write** — no schema step.

- **SSL:** the backend defaults to `ssl: { rejectUnauthorized: false }`, which is for a managed cluster's cert. Over the docker network there is no TLS to verify, so set `DATABASE_SSL=off`.
- **Pooling:** `PG_POOL_MAX` (default 5). The server is configured for `max_connections=50` shared with everything else on the box, so leave the pool small.
- **Backups:** nothing to configure. `pg-backup` discovers every running `postgres:*` container and dumps every database it finds, so `prismona` is picked up by the next nightly run (03:30 UTC). Restore with `pg-restore` into a *new* database — see `deploy/README.md`.

**Data: starting fresh — no migration.** The new database begins empty; the managed cluster's contents are abandoned, not copied. Practical effect: existing **auth accounts** and the **observed / learned / feedback** history are wiped — users re-sign-in, and those layers rebuild from new activity. **Client-side blueprints (localStorage) are unaffected** — they live in each user's browser. Pass the old `AUTH_SECRET` to the first deploy if you want already-issued recovery keys to stay signable.

## Step 2 — Set `PRISMONA_BASE_URL`

`PRISMONA_BASE_URL=https://prismona.io` (or whatever host you publish on). This points the MCP tools' internal API calls at the right host.

## Step 3 — Stand up the app on the droplet

```sh
HOST=root@<droplet-ip> deploy/deploy.sh
```

rsyncs the repo to `/opt/prismona`, generates `.env`, creates the role + database, and runs `docker compose up -d --build`. The container publishes **`127.0.0.1:3000`** only; nginx on the host reverse-proxies to it. Full detail, including how to build the image off-box if the 2 GB droplet can't, is in **`deploy/README.md`**.

Environment (`/opt/prismona/.env`, mode 600):

- `DATABASE_URL` · `DATABASE_SSL=off` · `AUTH_SECRET` · `PRISMONA_BASE_URL`
- No `RESEND_API_KEY`/email service — accounts are self-generated recovery keys (`docs/research/PRIVACY-AND-ANONYMITY.md`).
- Optional: `PG_POOL_MAX`, `OBS_RETENTION_DAYS` (observed-layer age-out; default 180, 0 disables)
- Drop `BLOB_READ_WRITE_TOKEN` once fully on Postgres (then `npm rm @vercel/blob` and delete the `vercelStore` block in `blob.ts`).

## Step 4 — Replace the SSO preview gate

Vercel Deployment Protection (the 401 on qa) doesn't exist here. Options:

- **Nothing** — rely on the app's own sign-in for gated areas.
- **Basic-auth `middleware.ts`** for a staging lock (keep `/api/mcp` and `/api/health` open):

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
export const config = { matcher: ["/((?!_next|favicon|api/mcp|api/health).*)"] };
```

## Step 5 — DNS cutover (Porkbun → the droplet)

1. Point `prismona.io` (+ `www`) at the droplet's IP with `A` records at Porkbun.
2. Add the vhost and cert with CloudPanel's CLI — **not** by hand-editing `/etc/nginx/sites-enabled/`, which CloudPanel rewrites:

```sh
clpctl site:add:reverse-proxy --domainName=prismona.io \
  --reverseProxyUrl='http://127.0.0.1:3000' --siteUser=prismona --siteUserPassword='<pw>'
clpctl lets-encrypt:install:certificate --domainName=prismona.io \
  --subjectAlternativeName=www.prismona.io
```

3. Verify the app, the MCP endpoint (`/api/mcp`), `/api/health`, and auth on the new domain **before** removing the Vercel domain. Optionally put **Cloudflare** in front for CDN + caching (one droplet, one region).

## Step 6 — Decommission

After verification: remove the domain from Vercel, delete the Vercel project, drop `BLOB_READ_WRITE_TOKEN`, and `npm rm @vercel/blob`. Then destroy the managed Postgres cluster — this is the recurring cost the move exists to remove:

```sh
doctl databases list                     # confirm the id
doctl databases delete <prismona-db-id>  # irreversible
```

---

## Suggested order (incremental, low-risk)

1. **Deploy to the droplet** (`deploy/deploy.sh`) and verify over an SSH tunnel or a staging hostname, while Vercel still serves production.
2. Confirm the nightly backup covers the new database (`pg-backup`, then check `/var/backups/postgres/postgres/<stamp>/prismona.dump.zst`).
3. Cut over DNS (Step 5), verify on the real domain.
4. Decommission Vercel **and destroy the managed cluster** (Step 6).

## Caveats

- **The droplet is small and shared.** 1 vCPU / 2 GB, also running Joplin, MariaDB, Varnish and CloudPanel. The app container is capped at 512 MB; builds lean on swap. If a build OOMs, build for `linux/amd64` elsewhere and `docker save | ssh docker load` (see `deploy/README.md`).
- **Single host, no failover.** The managed cluster had DO's backups and standby; this trades that for a nightly logical dump to object storage and a documented restore. Recovery point is up to 24h, recovery time is a `pg-restore` away. That's the deal the cost saving buys.
- **`randomSuffix`**: Vercel auto-uniquified keys; the Postgres backend appends `.{uuid}` itself. Stores enumerate by `list(prefix)`, so this is transparent.
- **MCP endpoint URL changes** (`…vercel.app/api/mcp` → `prismona.io/api/mcp`): re-share with connected agents; existing share codes are unaffected (self-contained).
- **Why Postgres over object storage:** the data is small structured JSON, not large files — so object storage's one advantage doesn't apply, and `jsonb` keeps the corpus queryable for re-norming/analytics (PRD §6).
