import type { Profile, ReportKey, Snapshot } from "./types";

// Retest timeline: traits change slowly but measurably (Roberts et al.,
// 2007). We only call a change real when the ±1 SEM percentile bands of the
// first and latest measurements fail to overlap — anything inside the bands
// is reported as stability, not news.

export const HISTORY_CAP = 24;

const KEYS: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];

export function snapshotOf(p: Profile): Snapshot {
  const traits = {} as Snapshot["traits"];
  KEYS.forEach((k) => {
    const { pct, lo, hi } = p.traits[k];
    traits[k] = { pct, lo, hi };
  });
  return { date: p.date, tier: p.tier, traits, consistency: p.quality.consistency };
}

// Append with same-day same-tier replacement (a retake supersedes, not
// duplicates) and a hard cap that drops the oldest entries.
export function pushSnapshot(history: Snapshot[], s: Snapshot): Snapshot[] {
  const kept = history.filter((h) => !(h.date === s.date && h.tier === s.tier));
  return [...kept, s].slice(-HISTORY_CAP);
}

export interface TraitDrift {
  from: number;
  to: number;
  delta: number;
  shifted: boolean; // first/latest ±1 SEM bands do not overlap
}

export interface DriftReport {
  n: number;
  from: string;
  to: string;
  traits: Record<ReportKey, TraitDrift>;
  stable: boolean;
}

export function traitDrift(history: Snapshot[]): DriftReport | null {
  if (history.length < 2) return null;
  const first = history[0];
  const last = history[history.length - 1];
  const traits = {} as Record<ReportKey, TraitDrift>;
  KEYS.forEach((k) => {
    const a = first.traits[k];
    const b = last.traits[k];
    traits[k] = {
      from: a.pct,
      to: b.pct,
      delta: b.pct - a.pct,
      shifted: b.lo > a.hi || b.hi < a.lo,
    };
  });
  return {
    n: history.length,
    from: first.date,
    to: last.date,
    traits,
    stable: KEYS.every((k) => !traits[k].shifted),
  };
}
