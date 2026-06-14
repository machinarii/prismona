import { redact } from "./observation";

// Learned-persona layer (Composer Phase 2): an agent, after working with the
// owner, reports what landed and what to adjust. These qualitative signals are
// synthesized into a short "learned adjustments" block folded onto the agent's
// seed persona — the continuous-tuning two-layer model (measured seed + observed
// overlay) applied to an agent instead of a person. Behavioral/style tags only,
// PII-redacted; never trait scores. Deterministic synthesis (no LLM), dates
// compared to the latest entry so it is reproducible and testable.

const TAG_LEN = 60;
const TAG_ITEMS = 8;
const HALF_LIFE_DAYS = 30;
const TOP_N = 5;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface AgentLearnInput {
  agent?: string;   // reporting agent id
  worked?: string[]; // registers / behaviors that landed
  adjust?: string[]; // corrections / preferred changes
}
export interface AgentLearnEntry extends AgentLearnInput { date: string }

export interface LearnedOverlay {
  updated: string;
  reports: number;
  worked: string[];
  adjust: string[];
  note: string; // a paste-ready block to append to the seed persona
}

function cleanTags(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((s) => redact(s).trim().slice(0, TAG_LEN))
    .filter(Boolean)
    .slice(0, TAG_ITEMS);
}

export function validateLearn(body: unknown): AgentLearnInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const worked = cleanTags(b.worked);
  const adjust = cleanTags(b.adjust);
  if (!worked.length && !adjust.length) return null;
  const agent = typeof b.agent === "string" ? redact(b.agent).trim().slice(0, 40) : undefined;
  return { ...(agent ? { agent } : {}), worked, adjust };
}

const daysBetween = (a: string, b: string) =>
  Math.abs(Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000));

function rollup(entries: AgentLearnEntry[], latest: string, key: "worked" | "adjust"): string[] {
  const acc = new Map<string, number>();
  for (const e of entries) {
    const w = Math.pow(0.5, daysBetween(e.date, latest) / HALF_LIFE_DAYS);
    for (const tag of e[key] ?? []) acc.set(tag, (acc.get(tag) ?? 0) + w);
  }
  return [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_N).map(([t]) => t);
}

export function synthesizeLearn(entries: AgentLearnEntry[]): LearnedOverlay | null {
  const valid = entries.filter((e) => e && ISO_DATE.test(e.date));
  if (!valid.length) return null;
  const latest = valid.reduce((m, e) => (e.date > m ? e.date : m), valid[0].date);
  const worked = rollup(valid, latest, "worked");
  const adjust = rollup(valid, latest, "adjust");
  const lines: string[] = [];
  if (worked.length) lines.push(`What works with this person: ${worked.join(", ")}.`);
  if (adjust.length) lines.push(`Adjust toward: ${adjust.join(", ")}.`);
  const note = lines.length
    ? `LEARNED (from ${valid.length} interaction report${valid.length === 1 ? "" : "s"}, most recent ${latest}): ${lines.join(" ")} These observed adjustments take precedence over the seed persona where they conflict.`
    : "";
  return { updated: latest, reports: valid.length, worked, adjust, note };
}
