import { toBase64url, fromBase64url } from "./codec";
import { profileFromRaw, VALUE_ORDER, type ValueKey, type ValuesProfile } from "./values";

// Values share code: the 10 per-value best-worst scores packed into 12 bytes,
// base64url-encoded, prefixed PRSM-VAL-. Carries only the value priority scores —
// no items, no answers, no identity. Decodes back to the full ranked profile.
// Layout: [version, ...10 scores (offset +64), checksum].

const PREFIX = "PRSM-VAL-";
const clampByte = (n: number) => Math.max(-63, Math.min(63, Math.round(n))) + 64;
const checksum = (bytes: number[]) => bytes.reduce((s, b) => (s + b) & 255, 0);

export function encodeValuesCode(p: ValuesProfile): string {
  const byVal = {} as Record<ValueKey, number>;
  for (const s of p.scores) byVal[s.value] = s.score;
  const bytes = [1, ...VALUE_ORDER.map((v) => clampByte(byVal[v] ?? 0))];
  bytes.push(checksum(bytes));
  return PREFIX + toBase64url(bytes);
}

export function decodeValuesCode(code: string): ValuesProfile | null {
  const t = code.trim();
  // Case-insensitive prefix check, but slice from the original (base64url is case-sensitive).
  const body = t.toUpperCase().startsWith(PREFIX) ? t.slice(PREFIX.length) : null;
  if (!body) return null;
  const bytes = fromBase64url(body);
  if (!bytes || bytes.length !== 12) return null; // 1 version + 10 scores + 1 checksum
  if (bytes[0] !== 1) return null;
  if (checksum(bytes.slice(0, 11)) !== bytes[11]) return null;
  const raw = {} as Record<ValueKey, number>;
  VALUE_ORDER.forEach((v, i) => { raw[v] = bytes[1 + i] - 64; });
  return profileFromRaw(raw);
}
