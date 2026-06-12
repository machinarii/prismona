import { describe, expect, it } from "vitest";
import * as app from "../codec";
import * as pkg from "../../packages/codec/src/index";
import type { ReportKey, ShareProfile } from "../types";

// The publishable @prismona/codec package is self-contained by design; this
// parity suite is the contract that it and the app codec never drift.

const share = (z: Partial<Record<ReportKey, number>>, tier: "quick" | "full" = "full"): ShareProfile => ({
  v: 1, tier, date: "2026-06-12",
  z: { O: 0, C: 0, E: 0, A: 0, ES: 0, H: 0, ...z },
  consistency: 77,
});

const SAMPLES: ShareProfile[] = [
  share({}),
  share({ O: 1.13, C: -0.42, E: 0.87, A: -1.21, ES: 0.33, H: 0.91 }),
  share({ O: -3.2, C: 3.2 }, "quick"), // clamping territory
];

describe("@prismona/codec parity with the app codec", () => {
  it("encodes identically for every sample", () => {
    SAMPLES.forEach((s) => {
      expect(pkg.encodeShareCode(s)).toBe(app.encodeShareCode(s));
    });
  });

  it("decodes the app's codes identically, field for field", () => {
    SAMPLES.forEach((s) => {
      const code = app.encodeShareCode(s);
      expect(pkg.decodeShareCode(code)).toEqual(app.decodeShareCode(code));
    });
  });

  it("rejects the same garbage", () => {
    ["", "PRSM-", "PRSM-short", "PRSM-!!!!!!!!!!!!!!!!", "PRSM-AAAAAAAAAAAAAAAB"].forEach((bad) => {
      expect(pkg.decodeShareCode(bad)).toEqual(app.decodeShareCode(bad));
    });
  });

  it("the package round-trips standalone", () => {
    const s = SAMPLES[1];
    const decoded = pkg.decodeShareCode(pkg.encodeShareCode(s))!;
    expect(decoded.tier).toBe("full");
    expect(decoded.date).toBe("2026-06-12");
    expect(Math.abs(decoded.z.O - 1.13)).toBeLessThanOrEqual(0.025);
    expect(decoded.consistency).toBe(77);
  });
});
