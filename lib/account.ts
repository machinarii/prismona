// Self-generated account keys — the Mullvad-style identity primitive that
// replaces email sign-in. A key is high-entropy and generated in the browser;
// the server stores only HMAC(key) (see lib/auth.ts accountId), never the key
// itself. Lose the key, lose the synced copy — that lack of recovery is the
// privacy. See docs/research/PRIVACY-AND-ANONYMITY.md.

// Crockford-style alphabet with no look-alikes (no I, O, 0, 1): 32 symbols,
// 5 bits each. 16 symbols ⇒ 80 bits of entropy.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const GROUPS = 4;
const GROUP_LEN = 4;
const BODY_LEN = GROUPS * GROUP_LEN; // 16
const PREFIX = "PRSM-ACCT-";
const STRIPPED_PREFIX = "PRSMACCT"; // PREFIX with separators removed

const group = (body: string) => PREFIX + (body.match(/.{1,4}/g) ?? []).join("-");
const BODY_RE = new RegExp(`^[${ALPHABET}]{${BODY_LEN}}$`);

export function generateAccountKey(): string {
  const bytes = new Uint8Array(BODY_LEN);
  globalThis.crypto.getRandomValues(bytes);
  let body = "";
  for (let i = 0; i < BODY_LEN; i++) body += ALPHABET[bytes[i] % 32];
  return group(body);
}

// Accept a key with any spacing/casing (and an optional pasted prefix), return
// the canonical PRSM-ACCT-XXXX-XXXX-XXXX-XXXX form, or null if it isn't valid.
export function normalizeAccountKey(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let s = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.length === STRIPPED_PREFIX.length + BODY_LEN && s.startsWith(STRIPPED_PREFIX)) {
    s = s.slice(STRIPPED_PREFIX.length);
  }
  return BODY_RE.test(s) ? group(s) : null;
}

export function isAccountKey(input: unknown): boolean {
  return normalizeAccountKey(input) !== null;
}
