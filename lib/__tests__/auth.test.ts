import { describe, expect, it } from "vitest";
import {
  generateCode, hashCode, normalizeEmail, signSession, verifyCode, verifySession,
} from "../auth";

const SECRET = "test-secret-please-rotate";

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  Jin@Example.COM ")).toBe("jin@example.com");
  });

  it("rejects non-emails", () => {
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(normalizeEmail("a@b")).toBeNull();
    expect(normalizeEmail("")).toBeNull();
  });
});

describe("codes", () => {
  it("generates six digits", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateCode()).toMatch(/^\d{6}$/);
    }
  });

  it("hashes are stable, salted by email, and never reveal the code", () => {
    const h = hashCode("123456", "jin@example.com", SECRET);
    expect(h).toBe(hashCode("123456", "jin@example.com", SECRET));
    expect(h).not.toBe(hashCode("123456", "other@example.com", SECRET));
    expect(h).not.toContain("123456");
  });

  it("verifyCode checks hash, expiry, and attempt budget", () => {
    const record = {
      hash: hashCode("123456", "jin@example.com", SECRET),
      expiresAt: Date.now() + 60_000,
      attempts: 0,
    };
    expect(verifyCode("123456", "jin@example.com", record, SECRET)).toBe(true);
    expect(verifyCode("999999", "jin@example.com", record, SECRET)).toBe(false);
    expect(verifyCode("123456", "jin@example.com", { ...record, expiresAt: Date.now() - 1 }, SECRET)).toBe(false);
    expect(verifyCode("123456", "jin@example.com", { ...record, attempts: 5 }, SECRET)).toBe(false);
  });
});

describe("sessions", () => {
  it("round-trips a session token", () => {
    const token = signSession("jin@example.com", SECRET, 1000 * 60);
    const session = verifySession(token, SECRET);
    expect(session?.email).toBe("jin@example.com");
  });

  it("rejects tampered and expired tokens", () => {
    const token = signSession("jin@example.com", SECRET, 1000 * 60);
    expect(verifySession(token + "x", SECRET)).toBeNull();
    expect(verifySession(token.replace(/^[^.]+/, "AAAA"), SECRET)).toBeNull();
    const expired = signSession("jin@example.com", SECRET, -1000);
    expect(verifySession(expired, SECRET)).toBeNull();
  });

  it("rejects tokens signed with a different secret", () => {
    const token = signSession("jin@example.com", "other-secret", 1000 * 60);
    expect(verifySession(token, SECRET)).toBeNull();
  });
});
