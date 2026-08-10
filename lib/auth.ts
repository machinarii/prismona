import { createHmac, timingSafeEqual } from "crypto";

// Account sessions, server-side only. Identity is a self-generated recovery key
// (lib/account.ts) — never email. The server derives accountId = HMAC(key) and
// stores only that; a database dump reveals no keys and cannot be reversed
// without AUTH_SECRET. Sessions are stateless HMAC-signed tokens carrying the
// pseudonymous id in an httpOnly cookie. See docs/research/PRIVACY-AND-ANONYMITY.md.

// Pseudonymous, irreversible account id derived from a recovery key. The raw key
// is never persisted — only this 24-char digest ever appears server-side.
export function accountId(key: string, secret: string): string {
  return createHmac("sha256", secret).update(`acct:${key}`).digest("base64url").slice(0, 24);
}

export interface Session {
  acct: string; // accountId, never the raw key
  exp: number;  // epoch ms
}

const b64u = (s: string) => Buffer.from(s).toString("base64url");
const sign = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest("base64url");

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function signSession(acct: string, secret: string, ttlMs = SESSION_TTL_MS): string {
  const payload = b64u(JSON.stringify({ acct, exp: Date.now() + ttlMs }));
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySession(token: string, secret: string): Session | null {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(mac);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    if (typeof session.acct !== "string" || typeof session.exp !== "number") return null;
    if (Date.now() > session.exp) return null;
    return session;
  } catch {
    return null;
  }
}
