import { blob, blobConfigured } from "./blob";
import { accountId, verifySession, type Session } from "../auth";

// Account storage on the abstracted blob store. Identity is a self-generated
// recovery key (lib/account.ts); paths are keyed by accountId = HMAC(key,
// AUTH_SECRET) — the raw key never touches disk and the address space is
// irreversible without the secret. No email, no Resend, no codes. Server-only.
// See docs/research/PRIVACY-AND-ANONYMITY.md.

// Sessions need only the signing secret; sync additionally needs storage.
export const authConfigured = () => Boolean(process.env.AUTH_SECRET);
export const syncConfigured = () => Boolean(blobConfigured() && process.env.AUTH_SECRET);

export const secret = () => process.env.AUTH_SECRET ?? "";
export const SESSION_COOKIE = "prismona_session";

// Turn a recovery key into its pseudonymous account id (storage namespace).
export const acctIdFor = (key: string) => accountId(key, secret());

export function sessionFrom(req: Request): Session | null {
  const cookies = req.headers.get("cookie") ?? "";
  const match = cookies.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  if (!match || !process.env.AUTH_SECRET) return null;
  return verifySession(match[1], secret());
}

const profilePath = (acct: string) => `acct/${acct}/profile.json`;

async function readJson<T>(pathname: string): Promise<T | null> {
  try {
    const text = await blob.get(pathname);
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  }
}

export const loadSyncedProfile = (acct: string) => readJson<unknown>(profilePath(acct));
export const saveSyncedProfile = (acct: string, data: unknown) =>
  blob.put(profilePath(acct), JSON.stringify(data));
export const deleteSyncedProfile = async (acct: string) => {
  try { await blob.del(profilePath(acct)); } catch { /* ignore */ }
};
