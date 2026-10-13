# Prismona — Privacy & Anonymity Model

_Last updated: 2026-06-21_

How identity-less services are built, where Prismona already sits, and the **recommended account model**: a Mullvad-style self-generated **recovery key** that replaces email — so the service genuinely does not know who its users are.

Prismona's existing posture: profiles live in the browser (localStorage), share codes are self-contained signed tokens that carry their own z-scores, and server-side data is HMAC-keyed. The one identifier in the whole system is the **email used for cross-device sync** — the same weak point that a phone number is for Signal. This doc closes that gap.

---

## 1 — The landscape: services that don't know who you are

The reference standard is **Mullvad VPN**:

- **Account = a random 16-digit number.** No email, username, password, or name. You generate a number; that is your entire identity.
- **Anonymous payment** — cash mailed in an envelope, Monero, or crypto. Cards work, but the card identity stays with the processor and is never linked to activity.
- **Nothing to seize.** RAM-only servers, no activity logs. When police raided their office (2023) they left with nothing, because nothing was stored.
- **Verifiable** — open source and independently audited; favorable jurisdiction (Sweden).
- **The trade-off is deliberate:** lose the number, lose the account. The lack of recovery *is* the privacy.

### Peers, by the mechanism they use

| Service | How identity is avoided |
|---|---|
| **IVPN** | Mullvad-style random account ID; Monero/cash; no-logs; audited |
| **Session** (messenger) | No phone/email — account is a random cryptographic ID; onion-routed |
| **SimpleX Chat** | The radical case: **no user identifier at all** — pairwise queue addresses, so there is no account to know |
| **Signal** | Stores almost nothing (subpoena replies show only account-created + last-seen dates) — but a **phone number** is its identity weak point (now adding usernames) |
| **Proton** (Mail/VPN) | Zero-access E2E encryption — cannot read content even if compelled; anonymous signup; Swiss jurisdiction |
| **Standard Notes / Tuta** | E2E encrypted; server holds ciphertext only |
| **Monero** | The anonymous *money* layer the VPNs rely on — hides sender, receiver, amount |
| **Tor / DuckDuckGo / Brave** | No account exists — anonymity by simply not collecting |

### The five patterns

1. **No-PII account** — the identifier is a random token *the user* generates, not an email/phone (Mullvad number, Session ID).
2. **No account at all** — local-first or pairwise (SimpleX, Tor, local apps). The strongest: there is nothing to know.
3. **Anonymous payment** — cash/Monero so the money trail can't deanonymize.
4. **Zero-knowledge / E2E** — the server holds ciphertext; can't read it under subpoena.
5. **Data minimization + "nothing to seize"** — what you don't store can't be compelled; backed by open source, audits, and jurisdiction.

---

## 2 — Where Prismona already sits

Prismona is already in the **strongest category (#2, "no account at all")** *by default*:

- Profiles live in `localStorage` (`lib/storage.ts`) — nothing personal leaves the browser unless the user acts.
- Share codes (`PRSM-…`) are **self-contained, signed tokens**: the profile travels inside the code. The core MCP tools (`decode_profile`, `compare_dyad`, `agent_persona`, …) are **pure functions of the codes passed in** — your server computes and returns, storing nothing.
- The optional accrual layers (observed / field-notes / learned / auth-sync) are **HMAC-keyed**: paths are `HMAC(code | email, AUTH_SECRET)`, so a database dump shows opaque 24-char hashes, not codes or emails, and can't be reversed without `AUTH_SECRET`.
- Behavioral observations are **PII-filtered at ingest** (`validateObservation`) and behavioral-only by contract.

**The single leak: email.** `lib/server/authstore.ts` keys sync storage by `HMAC(email)` and uses Resend to deliver sign-in codes. The email exists in plaintext *inside* the account record (it is the account) and is the one durable identifier Prismona holds. It is also an external-service coupling (Resend) that works against portability and the "nothing to seize" property.

---

## 3 — Recommended model: Mullvad-style recovery key (replaces email)

Replace email sign-in with a **self-generated account key** the user keeps — the same model as Mullvad's account number, and a natural fit for Prismona's existing self-contained-token architecture.

### How it works

- On "create account," the client generates a high-entropy key — e.g. `PRSM-ACCT-XXXX-XXXX-XXXX-XXXX` (or a 16-digit number). It is shown once, with a prominent "save this — it cannot be recovered" prompt and a copy/download action.
- **Account identity = `HMAC(accountKey, AUTH_SECRET)`** — the same pseudonymous-path scheme already used, but with **no email anywhere** in the system.
- **Sign in on a new device** = paste the key. No email round-trip, no delivery service, no 6-digit code. The session cookie is a signed token derived from the key's hash (reuse `verifySession` / HMAC session signing).
- **Synced profile** stored at `acct/HMAC(key)/profile.json` (replaces `auth/profiles/HMAC(email)`).
- **No recovery.** Lose the key → lose the *synced* copy. The browser's localStorage blueprint is unaffected (it never depended on the account). This is the Mullvad trade, made explicit in the UX.

### What changes in code

| Area | Change |
|---|---|
| New `lib/account.ts` (client) | Generate / format / validate the key; store it locally; copy & download helpers |
| `lib/server/authstore.ts` | Key all paths by `HMAC(accountKey)` instead of `emailKey`; drop `sendCodeEmail`, `StoredCode`, `ensureAccount(email)` |
| `app/api/auth/*` | Collapse `request` + `verify` into a single **claim/restore-by-key** route that validates the key and sets the session; drop the email-code flow |
| UI (sign-in surface) | Replace the email form with **"Generate account key"** / **"Restore with key"** |
| Env / deps | Remove `RESEND_API_KEY`, `EMAIL_FROM`, and the Resend dependency — one fewer external service (also helps portability + "nothing to seize") |

### What it costs

- **Lost-key = lost sync.** Mitigate with strong "save your key" UX and a downloadable key file. Do **not** add email escrow — it reintroduces the exact identifier we removed.
- **No email channel** — no notifications, re-engagement, or resets. None are needed for this product; it's a feature, not a loss.
- **Support burden** — people will lose keys. Mullvad accepts this as the price of not knowing who you are; so should Prismona.

### Why now

The DO migration already starts storage **fresh — no data migration** (existing email accounts get wiped at cutover regardless). That makes this the clean moment to swap the auth primitive: there is no legacy email data to migrate, and removing Resend **reinforces the portability work** (one fewer vendor coupling) at the same time.

### Honest scope (what this does *not* claim)

- **Payment anonymity (#3)** doesn't apply — Prismona is free. If paid tiers ever arrive, revisit with Monero/crypto in mind.
- **Zero-knowledge E2E (#4)** is a *separate, larger* step. The recovery-key model gives strong **pseudonymity** (no identity), not end-to-end encryption of the synced body. Encrypting the synced profile under a key derived from the account key is a credible follow-on (see [OPEN-SOURCE-STRATEGY](OPEN-SOURCE-STRATEGY.md) for the audit/verifiability angle that would back such a claim).
- The network layer is unchanged — Prismona is not a VPN; this is about *account identity*, not traffic anonymity.

---

## 4 — Summary

Prismona is already a "no account by default" product. Swapping email sign-in for a **self-generated recovery key** removes its one durable identifier, drops an external dependency, and lets the privacy page make a Mullvad-grade claim honestly: **the service does not know who its users are.** The trade — no key recovery — is the same one every identity-less service makes on purpose.
