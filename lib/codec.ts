import type { Profile, ReportKey, ShareProfile, Tier } from "./types";
import { toPct } from "./scoring";

// Share-code codec: a profile's domain-level z-scores packed into 12 bytes,
// base64url-encoded, prefixed for recognizability. Carries no facets, no
// answers, no identity — small enough to text someone.
//
// Layout: [version, tier, dateHi, dateLo, zO, zC, zE, zA, zES, zH,
//          consistency, checksum]
// z quantized to 0.05 steps (z*20, clamped ±3.15) and offset to uint8.

const PREFIX = "PRSM-";
const EPOCH_MS = Date.UTC(2020, 0, 1);
const KEYS: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function toBase64url(bytes: number[]): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i], b1 = bytes[i + 1], b2 = bytes[i + 2];
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    if (b1 == null) break;
    out += B64[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)];
    if (b2 == null) break;
    out += B64[b2 & 63];
  }
  return out;
}

function fromBase64url(s: string): number[] | null {
  const vals: number[] = [];
  for (const ch of s) {
    const v = B64.indexOf(ch);
    if (v < 0) return null;
    vals.push(v);
  }
  const bytes: number[] = [];
  for (let i = 0; i < vals.length; i += 4) {
    const [a, b, c, d] = [vals[i], vals[i + 1], vals[i + 2], vals[i + 3]];
    if (b == null) return null;
    bytes.push(((a << 2) | (b >> 4)) & 255);
    if (c != null) bytes.push(((b << 4) | (c >> 2)) & 255);
    if (d != null) bytes.push(((c << 6) | d) & 255);
  }
  return bytes;
}

const quantZ = (z: number) => Math.max(-63, Math.min(63, Math.round(z * 20))) + 128;
const checksum = (bytes: number[]) => bytes.reduce((s, b) => (s + b) & 255, 0);

export function encodeShareCode(p: Profile | ShareProfile): string {
  const z = "traits" in p
    ? (Object.fromEntries(KEYS.map((k) => [k, p.traits[k].z])) as Record<ReportKey, number>)
    : p.z;
  const consistency = "traits" in p ? p.quality.consistency : p.consistency;
  const days = Math.max(0, Math.min(65535, Math.round((Date.parse(p.date) - EPOCH_MS) / 86400000)));
  const bytes = [
    1,
    p.tier === "full" ? 1 : 0,
    days >> 8, days & 255,
    ...KEYS.map((k) => quantZ(z[k])),
    Math.max(0, Math.min(100, Math.round(consistency))),
  ];
  bytes.push(checksum(bytes));
  return PREFIX + toBase64url(bytes);
}

export function decodeShareCode(code: string): ShareProfile | null {
  const trimmed = code.trim().toUpperCase().startsWith(PREFIX)
    ? code.trim().slice(PREFIX.length)
    : code.trim();
  const bytes = fromBase64url(trimmed);
  if (!bytes || bytes.length !== 12) return null;
  if (bytes[0] !== 1) return null;
  if (checksum(bytes.slice(0, 11)) !== bytes[11]) return null;

  const tier: Tier = bytes[1] === 1 ? "full" : "quick";
  const days = (bytes[2] << 8) | bytes[3];
  const date = new Date(EPOCH_MS + days * 86400000).toISOString().slice(0, 10);
  const z = Object.fromEntries(
    KEYS.map((k, i) => [k, (bytes[4 + i] - 128) / 20]),
  ) as Record<ReportKey, number>;
  return { v: 1, tier, date, z, consistency: bytes[10] };
}

export function sharePct(p: ShareProfile): Record<ReportKey, number> {
  return Object.fromEntries(KEYS.map((k) => [k, toPct(p.z[k])])) as Record<ReportKey, number>;
}
