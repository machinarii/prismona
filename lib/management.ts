import type { Profile, ReportKey } from "./types";

// Management style for the AI tab: how this person runs work and wants
// collaboration run. The default is generated from the questionnaire; agents
// that actually work with the user can report what worked and what didn't
// (via the MCP report_collaboration tool), and those field notes fold into a
// weekly digest that sits beside — and gradually outranks — the default.

interface Tiered { hi: string; mid: string; lo: string }
const pick = (t: Tiered, pct: number) => (pct >= 70 ? t.hi : pct >= 40 ? t.mid : t.lo);

export interface StyleEntry { title: string; body: string }
export interface ManagementStyle {
  headline: string;
  entries: StyleEntry[];
  note: string;
}

export function managementStyle(p: Profile): ManagementStyle {
  const t = p.traits;
  const entries: StyleEntry[] = [
    {
      title: "Delegation",
      body: pick({
        hi: "Hand them outcomes with full context and get out of the way — they build their own scaffolding and resent redundant process. Check in at milestones they set, not intervals you set.",
        mid: "Delegate with explicit deliverables and dates; they hold what's written and drop some of what's assumed. Confirm the important handoffs in writing.",
        lo: "Delegate in small, concrete next actions with visible deadlines, and own the tracking layer yourself — externalized structure is collaboration, not distrust. Never assign vague open-ended ownership and hope.",
      }, t.C.pct),
    },
    {
      title: "Feedback",
      body: pick({
        hi: "They cushion their own critiques and may under-deliver hard messages — invite bluntness explicitly and reward it when it comes. When giving feedback, plain and private works; they will not escalate.",
        mid: "Straight, specific, behavior-anchored feedback lands best; tie it to the work, not the person, and expect engagement rather than defensiveness.",
        lo: "Be direct — they respect substance and can smell a compliment sandwich. Expect equally direct pushback and don't read it as insubordination; the argument is how they engage.",
      }, t.A.pct),
    },
    {
      title: "Cadence",
      body: pick({
        hi: "They process out loud and in motion — frequent short syncs beat long documents, and their first take sharpens through conversation. Leave room for thinking-by-talking.",
        mid: "Mixed cadence: a written agenda plus a short live touchpoint covers both their modes. Match the channel they initiate.",
        lo: "Async-first: written briefs, time to digest, decisions confirmed in writing. Back-to-back meetings tax them; their considered answer arrives after the room empties.",
      }, t.E.pct),
    },
    {
      title: "Under pressure",
      body: pick({
        hi: "Their steadiness under load is real — you can route hard news plainly. Watch the opposite failure: they may under-signal risk, so ask directly what worries them.",
        mid: "Steady at normal load, visibly taxed when stress stacks — give a beat before forcing decisions in a spike, and protect recovery time after pushes.",
        lo: "Pressure amplifies fast: never deliver hard news casually or pile urgency on urgency. Give them the wave's length — the considered response that follows is worth the pause.",
      }, t.ES.pct),
    },
    {
      title: "Novelty and process",
      body: pick({
        hi: "They reach for the new way first — give them green-field problems and pair them with finishers; forcing them through rigid process wastes the very thing you hired.",
        mid: "Balanced appetite: they adopt the proven and entertain the new with evidence. Good stewards of process changes.",
        lo: "They trust the proven — introduce change with evidence and one step at a time, and use them to stress-test shiny proposals before committing.",
      }, t.O.pct),
    },
  ];
  const headline = `A default read from the questionnaire — calibrate it against what actually happens.`;
  return {
    headline,
    entries,
    note: "This default is generated from self-report. Agents working with this person can report observations via MCP (report_collaboration); the weekly field notes below carry more weight than the questionnaire wherever they disagree.",
  };
}

// ---- field notes -----------------------------------------------------------

export interface FeedbackEntry {
  date: string; // ISO yyyy-mm-dd
  worked: string[];
  didnt: string[];
  agent?: string;
}

export interface FeedbackInput {
  worked: string[];
  didnt: string[];
  agent?: string;
}

const MAX_ITEMS = 5;
const MAX_LEN = 280;

export function validateFeedback(body: unknown): FeedbackInput | null {
  if (!body || typeof body !== "object") return null;
  const { worked, didnt, agent } = body as Record<string, unknown>;
  const clean = (v: unknown): string[] | null => {
    if (v === undefined) return [];
    if (!Array.isArray(v) || v.some((s) => typeof s !== "string")) return null;
    return (v as string[])
      .map((s) => s.trim().slice(0, MAX_LEN))
      .filter(Boolean)
      .slice(0, MAX_ITEMS);
  };
  const w = clean(worked);
  const d = clean(didnt);
  if (w === null || d === null) return null;
  if (w.length === 0 && d.length === 0) return null;
  const out: FeedbackInput = { worked: w, didnt: d };
  if (typeof agent === "string" && agent.trim()) out.agent = agent.trim().slice(0, 60);
  return out;
}

// ISO-8601 week id ("2026-W24") from an ISO date, via UTC arithmetic.
export function isoWeek(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = date.getUTCDay() || 7; // Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - day); // Thursday of this ISO week
  const isoYear = date.getUTCFullYear();
  const jan1 = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((date.getTime() - jan1.getTime()) / 86400000 + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

export interface WeekDigest {
  week: string;
  worked: string[];
  didnt: string[];
  sources: number;
  collecting: boolean;
}

export interface FeedbackDigest {
  weeks: WeekDigest[];
  total: number;
}

export function digestFeedback(entries: FeedbackEntry[], today: string): FeedbackDigest {
  const currentWeek = isoWeek(today);
  const byWeek = new Map<string, FeedbackEntry[]>();
  entries.forEach((e) => {
    const w = isoWeek(e.date);
    byWeek.set(w, [...(byWeek.get(w) ?? []), e]);
  });
  const weeks: WeekDigest[] = [...byWeek.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([week, list]) => ({
      week,
      worked: [...new Set(list.flatMap((e) => e.worked))],
      didnt: [...new Set(list.flatMap((e) => e.didnt))],
      sources: new Set(list.map((e) => e.agent ?? "anonymous")).size,
      collecting: week === currentWeek,
    }));
  return { weeks, total: entries.length };
}
