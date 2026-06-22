import { describe, expect, it } from "vitest";
import { generateAccountKey, isAccountKey, normalizeAccountKey } from "../account";

describe("generateAccountKey", () => {
  it("produces the canonical PRSM-ACCT-XXXX-XXXX-XXXX-XXXX shape", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateAccountKey()).toMatch(/^PRSM-ACCT-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    }
  });

  it("never uses look-alike characters (I, O, 0, 1)", () => {
    for (let i = 0; i < 50; i++) {
      const body = generateAccountKey().replace("PRSM-ACCT-", "").replace(/-/g, "");
      expect(body).not.toMatch(/[IO01]/);
    }
  });

  it("is effectively unique across many draws", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(generateAccountKey());
    expect(seen.size).toBe(1000);
  });
});

describe("normalizeAccountKey", () => {
  it("round-trips a freshly generated key", () => {
    const k = generateAccountKey();
    expect(normalizeAccountKey(k)).toBe(k);
  });

  it("tolerates spacing, lowercase, and a pasted prefix", () => {
    const k = generateAccountKey();
    const body = k.replace("PRSM-ACCT-", "");
    expect(normalizeAccountKey(body.toLowerCase())).toBe(k);
    expect(normalizeAccountKey(`  ${k.toLowerCase()}  `)).toBe(k);
    expect(normalizeAccountKey(body.replace(/-/g, " "))).toBe(k);
  });

  it("rejects wrong length, bad chars, and non-strings", () => {
    expect(normalizeAccountKey("PRSM-ACCT-ABCD")).toBeNull();        // too short
    expect(normalizeAccountKey("PRSM-ACCT-ABCD-EFGH-JKMN-PQRS-TVWX")).toBeNull(); // too long
    expect(normalizeAccountKey("PRSM-ACCT-IOIO-IOIO-IOIO-IOIO")).toBeNull(); // look-alikes
    expect(normalizeAccountKey("")).toBeNull();
    expect(normalizeAccountKey(null)).toBeNull();
    expect(normalizeAccountKey(42)).toBeNull();
  });
});

describe("isAccountKey", () => {
  it("agrees with normalizeAccountKey", () => {
    expect(isAccountKey(generateAccountKey())).toBe(true);
    expect(isAccountKey("nope")).toBe(false);
  });
});
