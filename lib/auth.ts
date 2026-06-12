import { createHmac, randomInt, timingSafeEqual } from "crypto";

// Email + code sign-in, server-side only. The account exists for exactly one
// optional job — syncing your profile across devices by explicit action —
// and the design keeps the surface minimal: six-digit codes hashed with an
// email-salted HMAC (never stored or logged in clear), ten-minute expiry,
// five attempts, and stateless HMAC-signed session tokens in an httpOnly
// cookie. Privacy Policy SIX documents what an account stores.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(input: string): string | null {
  const e = input.trim().toLowerCase();
  return EMAIL_RE.test(e) ? e : null;
}

export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashCode(code: string, email: string, secret: string): string {
  return createHmac("sha256", secret).update(`${email}:${code}`).digest("base64url");
}

export interface CodeRecord {
  hash: string;
  expiresAt: number; // epoch ms
  attempts: number;
}

export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;

export function verifyCode(code: string, email: string, record: CodeRecord, secret: string): boolean {
  if (record.attempts >= MAX_ATTEMPTS) return false;
  if (Date.now() > record.expiresAt) return false;
  const expected = Buffer.from(record.hash);
  const actual = Buffer.from(hashCode(code, email, secret));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export interface Session {
  email: string;
  exp: number; // epoch ms
}

const b64u = (s: string) => Buffer.from(s).toString("base64url");
const sign = (payload: string, secret: string) =>
  createHmac("sha256", secret).update(payload).digest("base64url");

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function signSession(email: string, secret: string, ttlMs = SESSION_TTL_MS): string {
  const payload = b64u(JSON.stringify({ email, exp: Date.now() + ttlMs }));
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
    if (typeof session.email !== "string" || typeof session.exp !== "number") return null;
    if (Date.now() > session.exp) return null;
    return session;
  } catch {
    return null;
  }
}
