# Migration — Vercel → DigitalOcean

_Runbook for moving Prismona off Vercel to DigitalOcean. The app is a Next.js 15 App Router project and is portable except for **two Vercel couplings**: `@vercel/blob` storage and a few hardcoded URLs. Everything else (SSR, API routes, the hosted MCP endpoint) runs unchanged on a Node host._

## What's coupled to Vercel

| Coupling | Where | Replacement |
|---|---|---|
| **`@vercel/blob`** storage | `lib/server/{observestore,agentlearnstore,feedbackstore,authstore}.ts`, `app/api/contribute/route.ts` | **DO Spaces** (S3-compatible) via `@aws-sdk/client-s3` |
| **Hardcoded `prismona.vercel.app` URLs** | `lib/mcptools.ts` (FEEDBACK/OBSERVE/AGENTLEARN APIs), `lib/export.ts` (schema), `lib/mcpguide.ts` (docs) | an env base URL |
| **Deployment Protection (SSO)** — the 401 preview gate | Vercel project setting | app's own email auth, or a basic-auth `middleware.ts` |
| **`vercel deploy` / `vercel alias`** | deploy scripts | DO App Platform git deploys (or `doctl apps`) |

Not used (good — nothing to migrate): Vercel KV, Vercel Postgres, Edge Functions, ISR.

---

## Step 1 — Replace `@vercel/blob` with DO Spaces (the main lift)

All blob usage is private object storage keyed by HMAC paths. Abstract it behind one interface, then point it at Spaces.

### 1a. Add the abstraction — `lib/server/blob.ts`

```ts
import { createHmac } from "crypto"; // (not needed here; just for context)

export interface BlobRef { key: string }
export interface BlobStore {
  put(key: string, body: string, opts?: { contentType?: string; randomSuffix?: boolean }): Promise<string>;
  get(key: string): Promise<string | null>;
  list(prefix: string, limit?: number): Promise<BlobRef[]>;
  del(key: string): Promise<void>;
}

// --- DO Spaces (S3-compatible) backend ---
import {
  S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const bucket = process.env.SPACES_BUCKET!;
const s3 = new S3Client({
  region: process.env.SPACES_REGION || "us-east-1",
  endpoint: process.env.SPACES_ENDPOINT,            // e.g. https://nyc3.digitaloceanspaces.com
  forcePathStyle: false,
  credentials: { accessKeyId: process.env.SPACES_KEY!, secretAccessKey: process.env.SPACES_SECRET! },
});

const rand = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export const spacesStore: BlobStore = {
  async put(key, body, opts) {
    const finalKey = opts?.randomSuffix ? `${key}.${rand()}` : key;
    await s3.send(new PutObjectCommand({
      Bucket: bucket, Key: finalKey, Body: body, ACL: "private",
      ContentType: opts?.contentType ?? "application/json",
    }));
    return finalKey;
  },
  async get(key) {
    try {
      const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      return res.Body ? await res.Body.transformToString() : null;
    } catch { return null; }            // NoSuchKey → null
  },
  async list(prefix, limit = 1000) {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, MaxKeys: limit }));
    return (res.Contents ?? []).map((c) => ({ key: c.Key! }));
  },
  async del(key) {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  },
};

export const blob: BlobStore = spacesStore;
export const blobConfigured = () =>
  Boolean(process.env.SPACES_BUCKET && process.env.SPACES_KEY && process.env.SPACES_SECRET);
```

`npm i @aws-sdk/client-s3` and `npm rm @vercel/blob`.

### 1b. Rewrite each store against the interface

The Vercel API → abstraction mapping (using `observestore.ts` as the template; the other three are identical patterns):

```ts
// BEFORE (Vercel)
import { del, get, list, put } from "@vercel/blob";
await put(`obs/${codeKey}/${entry.date}.json`, JSON.stringify(entry),
  { access: "private", contentType: "application/json", addRandomSuffix: true });
const { blobs } = await list({ prefix: `obs/${codeKey}/`, limit: MAX_ENTRIES });
const res = await get(b.pathname, { access: "private" });   // → res.stream / res.statusCode
await del(b.url);

// AFTER (abstraction)
import { blob, blobConfigured } from "./blob";
await blob.put(`obs/${codeKey}/${entry.date}.json`, JSON.stringify(entry), { randomSuffix: true });
const refs = await blob.list(`obs/${codeKey}/`, MAX_ENTRIES);  // → [{ key }]
const text = await blob.get(b.key);                           // → string | null
await blob.del(b.key);
```

Key changes per store:
- `blob.pathname` / `blob.url` → a single **`key`** (the abstraction normalizes both).
- `get(...).stream` + `statusCode` check → `blob.get(key)` returns `string | null`.
- `observeConfigured()` etc. → swap `BLOB_READ_WRITE_TOKEN` check for `blobConfigured()` (`SPACES_*`). Keep `AUTH_SECRET` (HMAC keying is unchanged).
- `authstore.ts` used `addRandomSuffix: false, allowOverwrite: true` → just `blob.put(key, body)` (S3 overwrites by default).

The four stores + `app/api/contribute/route.ts` each get this mechanical swap. No HMAC/logic changes.

> **Want this done?** This step is well-defined and self-contained — happy to implement the abstraction + rewrite the five files behind a `STORAGE=spaces|vercel` flag so both hosts work during cutover.

---

## Step 2 — Env-ize the hardcoded URLs

In `lib/mcptools.ts`, the three internal API constants are hardcoded:

```ts
const BASE = process.env.PRISMONA_BASE_URL ?? "https://prismona.vercel.app";
const FEEDBACK_API   = `${BASE}/api/feedback`;
const OBSERVE_API    = `${BASE}/api/observe`;
const AGENTLEARN_API = `${BASE}/api/agentlearn`;
```

Set `PRISMONA_BASE_URL` to the DO domain. Also update the schema URL in `lib/export.ts` and the docs links in `lib/mcpguide.ts` to the new domain (cosmetic, but do it so agents and the JSON schema resolve).

---

## Step 3 — Stand up DO App Platform

App Platform runs Next.js natively (git-based deploys). Minimal `app.yaml`:

```yaml
name: prismona
region: nyc
services:
  - name: web
    github:
      repo: machinarii/prismona
      branch: main           # or qa
      deploy_on_push: true
    build_command: npm run build
    run_command: npm start
    environment_slug: node-js
    instance_size_slug: basic-xxs
    http_port: 3000
    routes:
      - path: /
    envs:
      - { key: AUTH_SECRET,        scope: RUN_TIME, type: SECRET }
      - { key: RESEND_API_KEY,     scope: RUN_TIME, type: SECRET }
      - { key: SPACES_KEY,         scope: RUN_TIME, type: SECRET }
      - { key: SPACES_SECRET,      scope: RUN_TIME, type: SECRET }
      - { key: SPACES_BUCKET,      scope: RUN_TIME, value: prismona }
      - { key: SPACES_REGION,      scope: RUN_TIME, value: nyc3 }
      - { key: SPACES_ENDPOINT,    scope: RUN_TIME, value: https://nyc3.digitaloceanspaces.com }
      - { key: PRISMONA_BASE_URL,  scope: RUN_TIME, value: https://prismona.io }
```

`doctl apps create --spec app.yaml` (or paste in the dashboard). Ensure `package.json` has `"start": "next start -p 3000"`.

*Alternative — Droplet + Docker:* set `output: "standalone"` in `next.config.mjs`, build a Dockerfile (`node:20-slim`, copy `.next/standalone`), run behind nginx with `pm2`/systemd. More control, more ops; App Platform is the closer Vercel analog.

---

## Step 4 — Environment variables

Create a Spaces bucket + access keys (DO → Spaces → Manage Keys). Then set, on the DO app:

- `SPACES_KEY`, `SPACES_SECRET`, `SPACES_BUCKET`, `SPACES_REGION`, `SPACES_ENDPOINT`
- `AUTH_SECRET` (carry over — keeps existing HMAC keys/codes valid), `RESEND_API_KEY`, `AUTH_DEV_CODE` (if used)
- `PRISMONA_BASE_URL=https://prismona.io`

> Existing Blob data does **not** auto-migrate. If you need to preserve observations/feedback/learned/auth blobs, copy them from Vercel Blob into the Spaces bucket preserving key paths (one-off script). Auth accounts and observations are the only stateful data; everything else is client-side localStorage.

## Step 5 — Replace the SSO preview gate

Vercel Deployment Protection (the 401 on qa) is gone on DO. Options:
- **Nothing** — rely on the app's own email sign-in for gated areas.
- **Basic-auth `middleware.ts`** for a staging lock:

```ts
import { NextResponse, type NextRequest } from "next/server";
export function middleware(req: NextRequest) {
  if (!process.env.BASIC_AUTH_USER) return NextResponse.next();
  const auth = req.headers.get("authorization");
  const expected = "Basic " + btoa(`${process.env.BASIC_AUTH_USER}:${process.env.BASIC_AUTH_PASS}`);
  if (auth !== expected) {
    return new NextResponse("Auth required", { status: 401, headers: { "WWW-Authenticate": "Basic" } });
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next|favicon|api/mcp).*)"] }; // keep MCP open
```

## Step 6 — DNS cutover

1. In the DO app, add `prismona.io` (and `www`) as custom domains; DO issues a Let's Encrypt cert.
2. Update DNS at your registrar (Porkbun) per DO's instructions — typically an `A`/`ALIAS` to the app, or move the domain's nameservers to DO and add records there.
3. Verify the app, the MCP endpoint (`/api/mcp`), and auth all work on the new domain **before** removing the Vercel domain.

## Step 7 — Decommission Vercel

After verification: remove the domain from Vercel, then delete the Vercel project. Keep `@vercel/blob` data exported until you're confident.

---

## Caveats / gotchas

- **`addRandomSuffix`**: Vercel auto-uniquified keys and returned a URL; the Spaces backend appends a random tail itself (`key.<uuid>`). Stores enumerate by `list(prefix)`, so this is transparent — but don't reconstruct exact keys anywhere (nothing does).
- **`del` by URL → by key**: Vercel deleted by `blob.url`; Spaces deletes by `key`. The abstraction normalizes to `key`.
- **MCP endpoint URL changes** (`prismona.vercel.app/api/mcp` → `prismona.io/api/mcp`): update `mcptools.ts`/`mcpguide.ts` and re-share the endpoint with any connected agents; existing share codes are unaffected (self-contained).
- **JSON schema URL** (`/schema/profile.v1.json` in `export.ts`) should resolve on the new domain.
- **Cold starts**: App Platform basic instances sleep less aggressively than Vercel's free tier but size for your traffic.

## Suggested order

1. Step 1 (storage abstraction, dual-backend) — ship to Vercel first, verify nothing breaks.
2. Step 2 (env URLs).
3. Steps 3–4 (DO app + Spaces + env), deploy to a DO staging URL.
4. Step 5 (gate), Step 6 (DNS), Step 7 (decommission).
