import { describe, expect, it } from "vitest";
import { accountId, signSession, verifySession } from "../auth";
import { generateAccountKey } from "../account";

const SECRET = "test-secret-please-rotate";

describe("accountId", () => {
  it("is stable, secret-salted, and never reveals the key", () => {
    const key = generateAccountKey();
    const id = accountId(key, SECRET);
    expect(accountId(key, SECRET)).toBe(id);
    expect(accountId(key, "other-secret")).not.toBe(id);
    expect(id).not.toContain(key.replace(/-/g, ""));
    expect(id.length).toBe(24);
  });

  it("maps distinct keys to distinct ids", () => {
    expect(accountId(generateAccountKey(), SECRET)).not.toBe(accountId(generateAccountKey(), SECRET));
  });
});

describe("sessions", () => {
  it("round-trips a session token carrying the account id", () => {
    const token = signSession("abc123accountid", SECRET, 1000 * 60);
    expect(verifySession(token, SECRET)?.acct).toBe("abc123accountid");
  });

  it("rejects tampered and expired tokens", () => {
    const token = signSession("abc123accountid", SECRET, 1000 * 60);
    expect(verifySession(token + "x", SECRET)).toBeNull();
    expect(verifySession(token.replace(/^[^.]+/, "AAAA"), SECRET)).toBeNull();
    expect(verifySession(signSession("abc123accountid", SECRET, -1000), SECRET)).toBeNull();
  });

  it("rejects tokens signed with a different secret", () => {
    expect(verifySession(signSession("abc123accountid", "other-secret", 1000 * 60), SECRET)).toBeNull();
  });
});
