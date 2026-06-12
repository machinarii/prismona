import type { Profile, ReportKey, ShareProfile } from "./types";
import { ALPHA } from "./norms";
import { band } from "./scoring";
import { matchArchetypes } from "./archetypes";
import { decodeShareCode, encodeShareCode } from "./codec";

// A share code is a profile's unique URL payload: domain z-scores carried in
// the fragment (#) of /p, which browsers never transmit — the link is
// shareable while the data still never touches a server. This module
// reconstructs a renderable Profile from that payload, honestly: bands are
// rebuilt from the tier's alpha, archetypes recomputed, and everything a
// share code does not carry (facets, response quality counts) stays empty
// rather than being faked.

const KEYS: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];

export function profileFromShare(s: ShareProfile): Profile {
  const domainAlpha = s.tier === "full" ? ALPHA.fullDomain : s.tier === "standard" ? ALPHA.standardDomain : ALPHA.quickDomain;
  const traits = {} as Profile["traits"];
  KEYS.forEach((k) => {
    traits[k] = band(s.z[k], k === "H" ? ALPHA.h : domainAlpha);
  });
  return {
    v: 1,
    tier: s.tier,
    date: s.date,
    traits,
    facets: [],
    archetypes: matchArchetypes(s.z).map(({ name, match }) => ({ name, match })),
    quality: {
      fast: 0, timeouts: 0, straight: false, medLat: 0,
      answered: 0, total: 0, consistency: s.consistency,
    },
  };
}

export function profileUrl(p: Profile | ShareProfile, origin: string, path = "/p"): string {
  return `${origin}${path}#${encodeShareCode(p)}`;
}

// Canonical comparison: does this code (with or without prefix, however the
// URL mangled it) denote this profile? Decode → re-encode → compare, so the
// answer survives prefix stripping and never throws on garbage.
export function sameShareCode(code: string, p: Profile | ShareProfile): boolean {
  const decoded = decodeShareCode(code);
  if (!decoded) return false;
  return encodeShareCode(decoded) === encodeShareCode(p);
}
