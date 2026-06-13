// Behavioral observations submitted by agents via MCP — the daily "observed"
// layer of the continuous-tuning loop (see docs/specs/2026-06-13-continuous-tuning.md).
// STRICT: behavioral / style fields only — never names, message content, or any
// personal/private information. `validateObservation` enforces the schema and
// `redact` is the PII backstop applied to every free-text field. These never
// touch the measured trait scores.

export interface ObservationInput {
  agent?: string;
  period?: string; // yyyy-mm-dd (the day/session being summarized)
  communication: string[];
  work_style: string[];
  strategies: string[];
  quirks: string[];
  worked: string[];
  didnt: string[];
  notes?: string;
}

export interface ObservationEntry extends ObservationInput {
  date: string; // server ingest date (yyyy-mm-dd)
}

const TAG_LEN = 40;
const TAG_ITEMS = 8;
const NOTES_LEN = 280;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Conservative PII backstop: strip emails, URLs, @handles, and long digit runs
// (phones, IDs). Behavioral tags should never contain any of these — this is a
// safety net for when an agent ignores the "behavioral only" instruction.
export function redact(s: string): string {
  return s
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[removed]") // emails
    .replace(/https?:\/\/\S+/g, "[removed]")           // urls
    .replace(/@\w{2,}/g, "[removed]")                  // @handles
    .replace(/\+?\d[\d ().-]{7,}\d/g, "[removed]")     // phone / id runs
    .trim();
}

function cleanTags(v: unknown): string[] | null {
  if (v === undefined) return [];
  if (!Array.isArray(v) || v.some((s) => typeof s !== "string")) return null;
  return (v as string[])
    .map((s) => redact(s).slice(0, TAG_LEN))
    .filter(Boolean)
    .slice(0, TAG_ITEMS);
}

export function validateObservation(body: unknown): ObservationInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  const communication = cleanTags(b.communication);
  const work_style = cleanTags(b.work_style);
  const strategies = cleanTags(b.strategies);
  const quirks = cleanTags(b.quirks);
  const worked = cleanTags(b.worked);
  const didnt = cleanTags(b.didnt);
  if ([communication, work_style, strategies, quirks, worked, didnt].some((x) => x === null)) return null;

  const out: ObservationInput = {
    communication: communication!,
    work_style: work_style!,
    strategies: strategies!,
    quirks: quirks!,
    worked: worked!,
    didnt: didnt!,
  };

  const hasTags = [out.communication, out.work_style, out.strategies, out.quirks, out.worked, out.didnt]
    .some((a) => a.length > 0);
  if (typeof b.notes === "string" && b.notes.trim()) out.notes = redact(b.notes).slice(0, NOTES_LEN);
  if (!hasTags && !out.notes) return null;

  if (typeof b.agent === "string" && b.agent.trim()) out.agent = b.agent.trim().slice(0, 60);
  if (typeof b.period === "string" && ISO_DATE.test(b.period)) out.period = b.period;
  return out;
}
