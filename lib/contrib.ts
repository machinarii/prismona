import { decodeShareCode, encodeShareCode } from "./codec";

// Anonymous norms contribution: strictly opt-in, and the payload is exactly
// what a share code already reveals (six quantized z-scores, tier, date,
// consistency) plus an optional coarse age band. Country is derived
// server-side from the request's edge geo header and never stored with an
// IP. This module is the single gate the payload passes through — anything
// not validated here does not get stored.

export const AGE_BANDS = ["<18", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export interface Contribution {
  code: string; // canonical share code
  ageBand?: AgeBand;
}

export function validateContribution(body: unknown): Contribution | null {
  if (!body || typeof body !== "object") return null;
  const { code, ageBand } = body as Record<string, unknown>;
  if (typeof code !== "string") return null;
  const decoded = decodeShareCode(code);
  if (!decoded) return null;
  const out: Contribution = { code: encodeShareCode(decoded) };
  if (ageBand !== undefined) {
    if (typeof ageBand !== "string" || !(AGE_BANDS as readonly string[]).includes(ageBand)) return null;
    out.ageBand = ageBand as AgeBand;
  }
  return out;
}

export function normalizeCountry(header: string | null): string | null {
  if (!header) return null;
  const c = header.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(c) ? c : null;
}
