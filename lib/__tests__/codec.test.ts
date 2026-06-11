import { describe, expect, it } from "vitest";
import { decodeShareCode, encodeShareCode } from "../codec";
import type { ShareProfile } from "../types";

const sample = (over: Partial<ShareProfile> = {}): ShareProfile => ({
  v: 1,
  tier: "full",
  date: "2026-06-11",
  z: { O: 1.25, C: -0.6, E: 0.05, A: 2.1, ES: -3.0, H: 0 },
  consistency: 82,
  ...over,
});

describe("share-code codec", () => {
  it("round-trips within quantization error (0.05 z steps)", () => {
    const code = encodeShareCode(sample());
    const back = decodeShareCode(code)!;
    expect(back).not.toBeNull();
    expect(back.tier).toBe("full");
    expect(back.date).toBe("2026-06-11");
    expect(back.consistency).toBe(82);
    for (const k of ["O", "C", "E", "A", "ES", "H"] as const) {
      expect(Math.abs(back.z[k] - sample().z[k])).toBeLessThanOrEqual(0.026);
    }
  });

  it("clamps extreme z to ±3.15", () => {
    const back = decodeShareCode(encodeShareCode(sample({ z: { O: 9, C: -9, E: 0, A: 0, ES: 0, H: 0 } })))!;
    expect(back.z.O).toBeCloseTo(3.15, 5);
    expect(back.z.C).toBeCloseTo(-3.15, 5);
  });

  it("accepts codes with or without the PRSM- prefix and whitespace", () => {
    const code = encodeShareCode(sample());
    expect(decodeShareCode(`  ${code}  `)).not.toBeNull();
    expect(decodeShareCode(code.replace("PRSM-", ""))).not.toBeNull();
  });

  it("rejects corrupted codes (checksum)", () => {
    const code = encodeShareCode(sample());
    const tail = code.slice(-1) === "A" ? "B" : "A";
    expect(decodeShareCode(code.slice(0, -1) + tail)).toBeNull();
  });

  it("rejects garbage", () => {
    expect(decodeShareCode("not a code")).toBeNull();
    expect(decodeShareCode("")).toBeNull();
    expect(decodeShareCode("PRSM-@@@@")).toBeNull();
  });

  it("quick tier round-trips", () => {
    expect(decodeShareCode(encodeShareCode(sample({ tier: "quick" })))!.tier).toBe("quick");
  });
});
