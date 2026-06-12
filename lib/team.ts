import type { ReportKey, ShareProfile } from "./types";
import { matchArchetypes } from "./archetypes";
import { toPct } from "./scoring";
import { TRAIT_LABELS } from "./norms";

// Team composition from N share codes: deep-level trait composition predicts
// team performance (Bell, 2007), and founder-team personality mix predicts
// venture outcomes (McCarthy et al., 2023). We report diversity, role
// coverage, single points of failure, and the two evidence-based gates the
// dyad engine already enforces pairwise — low Honesty-Humility anywhere, and
// a team that is mostly low-Conscientiousness.

const KEYS: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];
const COVERAGE_FLOOR = 55; // a trait is "covered" when someone sits above this percentile
const STRONG = 60;
const LOW = 40;

export interface TeamMember {
  label: string;
  archetype: string;
  pct: Record<ReportKey, number>;
}

export interface TeamReport {
  n: number;
  members: TeamMember[];
  diversity: number; // 0–100, scaled mean pairwise distance in z-space
  coverage: Record<ReportKey, { max: number; owner: string }>;
  gaps: ReportKey[];
  singlePoints: ReportKey[];
  flags: string[];
  headline: string;
}

export function teamReport(shares: ShareProfile[]): TeamReport {
  if (shares.length < 2) throw new Error("a team report needs at least two profiles");

  const members: TeamMember[] = shares.map((s, i) => {
    const pct = {} as Record<ReportKey, number>;
    KEYS.forEach((k) => { pct[k] = toPct(s.z[k]); });
    return {
      label: String.fromCharCode(65 + i),
      archetype: matchArchetypes(s.z)[0].name,
      pct,
    };
  });

  // Mean pairwise Euclidean distance in 6D z-space; ~3.46 is the expectation
  // for two independent standard-normal profiles, so /3.5 ≈ population-typical = 100.
  let dSum = 0, pairs = 0;
  for (let i = 0; i < shares.length; i++) {
    for (let j = i + 1; j < shares.length; j++) {
      dSum += Math.sqrt(KEYS.reduce((s, k) => s + (shares[i].z[k] - shares[j].z[k]) ** 2, 0));
      pairs++;
    }
  }
  const diversity = Math.min(100, Math.round(((dSum / pairs) / 3.5) * 100));

  const coverage = {} as TeamReport["coverage"];
  const gaps: ReportKey[] = [];
  const singlePoints: ReportKey[] = [];
  KEYS.forEach((k) => {
    const best = members.reduce((a, b) => (b.pct[k] > a.pct[k] ? b : a));
    coverage[k] = { max: best.pct[k], owner: best.label };
    if (best.pct[k] < COVERAGE_FLOOR) gaps.push(k);
    if (members.filter((m) => m.pct[k] >= STRONG).length === 1) singlePoints.push(k);
  });

  const flags: string[] = [];
  if (diversity < 25) {
    flags.push("Mirror risk: this team's profiles are near-duplicates — agreement will feel like validation when it is resemblance (complementary spreads outperform; McCarthy et al., 2023).");
  }
  const lowH = members.filter((m) => m.pct.H < LOW);
  if (lowH.length) {
    flags.push(`Trust gate: member${lowH.length > 1 ? "s" : ""} ${lowH.map((m) => m.label).join(", ")} measure${lowH.length > 1 ? "" : "s"} low on Honesty-Humility — the strongest known predictor of exploitation risk. Vesting, transparency, and written commitments are structural requirements here, not formalities (Pletzer et al., 2019).`);
  }
  const lowC = members.filter((m) => m.pct.C < LOW);
  if (lowC.length >= shares.length / 2) {
    flags.push(`Execution risk: ${lowC.length} of ${shares.length} members are low on Conscientiousness — momentum will not be self-generating. Assign loop-closing ownership explicitly and import external cadence (Bell, 2007).`);
  }

  const strongest = [...KEYS].sort((a, b) => coverage[b].max - coverage[a].max)[0];
  const headline = gaps.length
    ? `A team of ${shares.length}, strongest on ${TRAIT_LABELS[strongest]}, with uncovered ground on ${gaps.map((k) => TRAIT_LABELS[k]).join(", ")} — hire or contract toward the gap.`
    : `A team of ${shares.length} with every trait covered — composition is not your constraint; role clarity is.`;

  return { n: shares.length, members, diversity, coverage, gaps, singlePoints, flags, headline };
}
