import { createHmac } from "crypto";
import { blob, blobConfigured } from "./blob";
import { verifySession, type Session } from "../auth";
import type { CodeRecord } from "../auth";

// Account storage on the private Blob store — no database, no new
// infrastructure. Paths are keyed by an HMAC of the email (the address
// itself appears only inside the account record, where it is the account).
// Everything here is server-only.

// Real email auth needs storage, AUTH_SECRET (signing) and Resend (delivery).
const realAuthConfigured = () =>
  Boolean(blobConfigured() && process.env.AUTH_SECRET && process.env.RESEND_API_KEY);

// Placeholder mode: a fixed dev sign-in code that works without Resend or Blob,
// so the login gate can be exercised anywhere. Set AUTH_SECRET + AUTH_DEV_CODE
// (a 6-digit code). Do NOT set AUTH_DEV_CODE in real production.
export const placeholderMode = () =>
  Boolean(process.env.AUTH_SECRET && process.env.AUTH_DEV_CODE);
export const devCode = () => process.env.AUTH_DEV_CODE ?? "";

export const authConfigured = () => realAuthConfigured() || placeholderMode();

export const secret = () => process.env.AUTH_SECRET ?? "";

export const SESSION_COOKIE = "prismona_session";

export function sessionFrom(req: Request): Session | null {
  const cookies = req.headers.get("cookie") ?? "";
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  if (!match || !process.env.AUTH_SECRET) return null;
  return verifySession(match[1], secret());
}

export function emailKey(email: string): string {
  return createHmac("sha256", secret()).update(email).digest("base64url").slice(0, 24);
}

async function readJson<T>(pathname: string): Promise<T | null> {
  try {
    const text = await blob.get(pathname);
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  }
}

async function writeJson(pathname: string, data: unknown): Promise<void> {
  await blob.put(pathname, JSON.stringify(data));
}

export interface StoredCode extends CodeRecord {
  resendAfter: number; // epoch ms — basic per-email rate limit
}

const codePath = (email: string) => `auth/codes/${emailKey(email)}.json`;
const accountPath = (email: string) => `auth/accounts/${emailKey(email)}.json`;
const profilePath = (email: string) => `auth/profiles/${emailKey(email)}.json`;

export const loadCode = (email: string) => readJson<StoredCode>(codePath(email));
export const saveCode = (email: string, rec: StoredCode) => writeJson(codePath(email), rec);
export const deleteCode = async (email: string) => { try { await blob.del(codePath(email)); } catch { /* ignore */ } };

export interface Account { email: string; createdMonth: string }

export async function ensureAccount(email: string): Promise<void> {
  const existing = await readJson<Account>(accountPath(email));
  if (!existing) {
    await writeJson(accountPath(email), { email, createdMonth: new Date().toISOString().slice(0, 7) });
  }
}

export const loadSyncedProfile = (email: string) => readJson<unknown>(profilePath(email));
export const saveSyncedProfile = (email: string, data: unknown) => writeJson(profilePath(email), data);
export const deleteSyncedProfile = async (email: string) => { try { await blob.del(profilePath(email)); } catch { /* ignore */ } };

export async function sendCodeEmail(email: string, code: string): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Prismona <onboarding@resend.dev>",
      to: [email],
      subject: `${code} is your Prismona sign-in code`,
      text: `Your Prismona sign-in code is ${code}\n\nIt expires in 10 minutes. If you didn't request it, ignore this email — nothing happens without the code.`,
    }),
  });
  return res.ok;
}
