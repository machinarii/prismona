import { toBase64url, fromBase64url } from "./codec";
import { AXIS_ORDER, profileFromScores, type DelegationAxis, type DelegationProfile } from "./delegation";

// Delegation share code: the 6 axis scores (0–100) packed into 8 bytes,
// base64url-encoded, prefixed PRSM-DEL-. Carries only the stated operating
// preferences — no scenarios, no answers, no identity. Same consent model as
// every PRSM code: possession is the grant.
// Layout: [version, ...6 scores, checksum].

const PREFIX = "PRSM-DEL-";
const clampScore = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const checksum = (bytes: number[]) => bytes.reduce((s, b) => (s + b) & 255, 0);

export function encodeDelegationCode(p: DelegationProfile): string {
  const bytes = [1, ...AXIS_ORDER.map((a) => clampScore(p.axes[a].score))];
  bytes.push(checksum(bytes));
  return PREFIX + toBase64url(bytes);
}

export function decodeDelegationCode(code: string): DelegationProfile | null {
  const t = code.trim();
  // Case-insensitive prefix check, but slice from the original (base64url is case-sensitive).
  const body = t.toUpperCase().startsWith(PREFIX) ? t.slice(PREFIX.length) : null;
  if (!body) return null;
  const bytes = fromBase64url(body);
  if (!bytes || bytes.length !== 8) return null; // 1 version + 6 scores + 1 checksum
  if (bytes[0] !== 1) return null;
  if (checksum(bytes.slice(0, 7)) !== bytes[7]) return null;
  if (bytes.slice(1, 7).some((b) => b > 100)) return null;
  const scores = {} as Record<DelegationAxis, number>;
  AXIS_ORDER.forEach((a, i) => { scores[a] = bytes[1 + i]; });
  return profileFromScores(scores);
}
