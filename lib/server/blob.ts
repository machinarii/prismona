// Storage abstraction: a tiny key → JSON blob store with put / get / list-by-prefix
// / del. Backends are chosen by env — DO Managed Postgres (DATABASE_URL) is the
// primary; Vercel Blob is kept as a fallback for the cutover window. Server-only.
// Chosen over object storage because the corpus stays queryable (jsonb) for
// re-norming and analytics later — see docs/MIGRATION-vercel-to-digitalocean.md.

export interface BlobRef { key: string }

export interface BlobStore {
  configured(): boolean;
  put(key: string, body: string, opts?: { randomSuffix?: boolean }): Promise<string>;
  get(key: string): Promise<string | null>;
  list(prefix: string, limit?: number): Promise<BlobRef[]>;
  del(key: string): Promise<void>;
}

const rand = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// ---- DO Managed Postgres backend (primary) ---------------------------------
// One table: blobs(key text primary key, body jsonb, created_at). The access
// pattern (put / get / list-by-prefix / del) maps cleanly, and jsonb keeps the
// data queryable — the reason to pick Postgres over object storage.
let poolPromise: Promise<import("pg").Pool> | null = null;
let readyPromise: Promise<void> | null = null;

async function pool() {
  if (!poolPromise) {
    poolPromise = (async () => {
      const { Pool } = await import("pg");
      return new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL === "off" ? undefined : { rejectUnauthorized: false },
        max: Number(process.env.PG_POOL_MAX ?? 5),
      });
    })();
  }
  return poolPromise;
}

async function ready() {
  if (!readyPromise) {
    readyPromise = (async () => {
      const p = await pool();
      await p.query(
        `create table if not exists blobs (
           key text primary key,
           body jsonb not null,
           created_at timestamptz not null default now()
         )`,
      );
    })();
  }
  return readyPromise;
}

const postgresStore: BlobStore = {
  configured: () => Boolean(process.env.DATABASE_URL),
  async put(key, body, opts) {
    const finalKey = opts?.randomSuffix ? `${key}.${rand()}` : key;
    const p = await pool();
    await ready();
    await p.query(
      `insert into blobs (key, body) values ($1, $2::jsonb)
       on conflict (key) do update set body = excluded.body`,
      [finalKey, body],
    );
    return finalKey;
  },
  async get(key) {
    const p = await pool();
    await ready();
    const r = await p.query<{ body: unknown }>(`select body from blobs where key = $1`, [key]);
    return r.rows.length ? JSON.stringify(r.rows[0].body) : null;
  },
  async list(prefix, limit = 1000) {
    const p = await pool();
    await ready();
    const r = await p.query<{ key: string }>(
      `select key from blobs where left(key, char_length($1)) = $1 limit $2`,
      [prefix, limit],
    );
    return r.rows.map((row) => ({ key: row.key }));
  },
  async del(key) {
    const p = await pool();
    await ready();
    await p.query(`delete from blobs where key = $1`, [key]);
  },
};

// ---- Vercel Blob backend (cutover fallback) --------------------------------
const vercelStore: BlobStore = {
  configured: () => Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  async put(key, body, opts) {
    const { put } = await import("@vercel/blob");
    const r = await put(key, body, {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: Boolean(opts?.randomSuffix),
      allowOverwrite: !opts?.randomSuffix,
    });
    return r.pathname;
  },
  async get(key) {
    const { get } = await import("@vercel/blob");
    try {
      const res = await get(key, { access: "private" });
      if (!res || res.statusCode !== 200) return null;
      return await new Response(res.stream).text();
    } catch {
      return null;
    }
  },
  async list(prefix, limit = 1000) {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix, limit });
    return blobs.map((b) => ({ key: b.pathname }));
  },
  async del(key) {
    // Vercel del() works by URL; resolve the key to its blob first.
    const { del, list } = await import("@vercel/blob");
    try {
      const { blobs } = await list({ prefix: key, limit: 1 });
      if (blobs[0]) await del(blobs[0].url);
    } catch {
      /* ignore */
    }
  },
};

const unconfigured: BlobStore = {
  configured: () => false,
  async put() { throw new Error("storage not configured"); },
  async get() { return null; },
  async list() { return []; },
  async del() { /* noop */ },
};

function pickStore(): BlobStore {
  if (process.env.DATABASE_URL) return postgresStore;
  if (process.env.BLOB_READ_WRITE_TOKEN) return vercelStore;
  return unconfigured;
}

export const blob: BlobStore = pickStore();
export const blobConfigured = () => blob.configured();
