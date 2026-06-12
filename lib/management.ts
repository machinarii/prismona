import type { Profile, ReportKey } from "./types";

// Management style for the AI tab: how this person runs work and wants
// collaboration run. The default is generated from the questionnaire; agents
// that actually work with the user can report what worked and what didn't
// (via the MCP report_collaboration tool), and those field notes fold into a
// weekly digest that sits beside — and gradually outranks — the default.

type Strength = "strong" | "tendency" | "light";

export interface StyleEntry { body: string; strength: Strength }
export interface StyleSection { key: string; heading: string; entries: StyleEntry[] }
export interface ManagementStyle {
  headline: string;
  sections: StyleSection[];
  note: string;
}

// Strength labels keyed to percentile extremity — the measurement's version
// of HARD RULE / STRONG TENDENCY / LIGHT PREFERENCE in a hand-written
// working doc: |pct−50| ≥ 35 reads as a strong tendency, ≥ 20 a tendency,
// anything nearer the median a light preference.
const strengthOf = (pct: number): Strength =>
  Math.abs(pct - 50) >= 35 ? "strong" : Math.abs(pct - 50) >= 20 ? "tendency" : "light";

type Dir = "hi" | "lo";
const TEXT: Record<string, Record<ReportKey, Record<Dir, string>>> = {
  core: {
    O: {
      hi: "Leads with the idea space: define the problem, build the model, then optimize the system — novelty is raw material, not risk.",
      lo: "Leads with the proven: precedent, working examples, and incremental upgrades over reinvention.",
    },
    C: {
      hi: "Leads through structure: clear owners, definitions of done, visible cadence — execution is the strategy.",
      lo: "Leads through momentum and judgment rather than process — structure arrives late and reluctantly.",
    },
    E: {
      hi: "Leads out loud: direction gets set in conversation, and energy is a management tool.",
      lo: "Leads in writing: thinking happens privately and arrives as a considered position.",
    },
    A: {
      hi: "Leads by alignment: fairness, consensus, and the relationship carry the decision.",
      lo: "Leads by argument: the best reasoning wins, regardless of whose it is.",
    },
    ES: {
      hi: "Leads as ballast: steady tempo, low drama, decisions that hold under pressure.",
      lo: "Leads with intensity: urgency is felt and transmitted — the speed is real, and so is the heat.",
    },
    H: {
      hi: "Leads by transparent criteria: consistent rules over politics, credit flowing where it's earned.",
      lo: "Leads pragmatically: outcomes over optics, comfortable taking the advantage.",
    },
  },
  strengths: {
    O: {
      hi: "Strategic problem-solving: spots root causes, hidden constraints, and second-order effects most people miss.",
      lo: "Institutional memory: remembers why the last clever idea failed and keeps the team off known mines.",
    },
    C: {
      hi: "Execution quality: commitments tracked without reminders, loops closed, slippage flagged before anyone notices.",
      lo: "Speed to motion: starts before conditions are perfect and learns faster by collision than others do by planning.",
    },
    E: {
      hi: "Recruitment energy: builds momentum in a room and pulls people into the work.",
      lo: "Depth: long protected stretches of focus produce unusually considered positions.",
    },
    A: {
      hi: "Trust fabric: de-escalates, absorbs friction, and keeps the team's cooperative average high.",
      lo: "Decision candor: pressure-tests assumptions and separates signal from noise without social padding.",
    },
    ES: {
      hi: "Crisis stability: judgment quality does not degrade under load — the team calibrates to it.",
      lo: "Risk sensitivity: registers trouble early; the alarm genuinely works.",
    },
    H: {
      hi: "Fairness via logic: consistent criteria and transparent reasoning instead of politics.",
      lo: "Negotiation realism: sees the incentive landscape plainly and plays it without illusion.",
    },
  },
  communication: {
    O: { hi: "", lo: "" }, C: { hi: "", lo: "" }, H: { hi: "", lo: "" },
    E: {
      hi: "Thinks out loud: direction sharpens in conversation — expect interruption-as-collaboration, and prefer live syncs to long documents.",
      lo: "Precise, idea-dense, written-first: strongest in async, prefers docs over meetings when feasible — and the silence is processing, not absence.",
    },
    A: {
      hi: "Feedback arrives cushioned: the unvarnished version exists, but you will have to invite it explicitly.",
      lo: "Feedback is accurate and improvement-oriented; it can miss the emotional landing unless that's made intentional.",
    },
    ES: { hi: "", lo: "" },
  },
  environment: {
    O: {
      hi: "A lab: curiosity, debate, iteration, respect for expertise — unconventional ideas and non-linear paths tolerated whenever the reasoning is solid.",
      lo: "A workshop: proven methods, craft standards, and low tolerance for thrash.",
    },
    C: {
      hi: "A cadence culture: rhythms, owners, and definitions of done are ambient rather than imposed.",
      lo: "A loose-structure culture: freedom-first — self-organizers thrive and structure-needers quietly drift.",
    },
    A: {
      hi: "A high-safety room: people speak early because speaking costs nothing.",
      lo: "A high-challenge room: ideas get stress-tested on arrival — rigor thrives, thin skin struggles.",
    },
    E: { hi: "", lo: "" }, ES: { hi: "", lo: "" }, H: { hi: "", lo: "" },
  },
  friction: {
    O: {
      hi: "Decision latency: keeps exploring and delays closure, especially under ambiguous priorities.",
      lo: "Change lag: retools slowly when the ground has genuinely shifted.",
    },
    C: {
      hi: "Process rigidity: polishing past the point of value; the diligently-executed task mistaken for the right task.",
      lo: "Under-manages execution: assumes others self-organize, and adds process too late.",
    },
    E: {
      hi: "Talk-to-think exhaust: directions multiply faster than closure, and quieter voices get outrun.",
      lo: "Low visibility: thinking stays internal until conclusion — to others it reads as sudden pivots.",
    },
    A: {
      hi: "Conflict debt: hard feedback gets deferred until it's expensive.",
      lo: "People-impact blind spot: debating the idea reads as debating the person.",
    },
    ES: {
      hi: "Under-reaction: steadiness can smooth over risk that deserved an alarm.",
      lo: "Pressure amplification: the first reaction overstates the considered position, and urgency transmits to the team.",
    },
    H: {
      hi: "Integrity projection: assumes counterparties operate on the same rules.",
      lo: "Gray-zone drift under pressure: needs structure that makes doing right also the easy path.",
    },
  },
  moves: {
    O: {
      hi: "Timebox exploration with them: agree up front when mapping ends and choosing begins.",
      lo: "Bring evidence with the new thing, and bring one change at a time.",
    },
    C: {
      hi: "Ask the altitude question: is the well-executed task still the right task?",
      lo: "Add lightweight structure for them — clear owners, definitions of done, checkpoint cadence — scaffolding, not micromanagement.",
    },
    E: {
      hi: "Convert talk into closure: end every discussion with one owner and one date.",
      lo: "Make their thinking legible early: ask for provisional decision criteria in writing before conclusions land as pivots.",
    },
    A: {
      hi: "Schedule the hard conversation for them — their temperament will defer it.",
      lo: "In conflict, address relationship and intent explicitly — not just the logic — so people feel safe engaging the rigor.",
    },
    ES: {
      hi: "Ask directly what worries them; the calm hides the risk register.",
      lo: "Don't negotiate with the spike: give the wave its hour, then decide.",
    },
    H: {
      hi: "Vet counterparties out loud on their behalf — they will extend trust first.",
      lo: "Write the agreements down and align incentives explicitly, every time.",
    },
  },
};

const KEYS6: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];

export function managementStyle(p: Profile): ManagementStyle {
  const dist = (k: ReportKey) => Math.abs(p.traits[k].pct - 50);
  const dir = (k: ReportKey): Dir => (p.traits[k].pct >= 50 ? "hi" : "lo");
  const entry = (section: string, k: ReportKey): StyleEntry => ({
    body: TEXT[section][k][dir(k)],
    strength: strengthOf(p.traits[k].pct),
  });
  const ranked = [...KEYS6].sort((a, b) => dist(b) - dist(a));
  const spiked = ranked.filter((k) => dist(k) >= 15);

  const pickFor = (section: string, candidates: ReportKey[], cap: number): StyleEntry[] =>
    candidates
      .filter((k) => TEXT[section][k][dir(k)])
      .slice(0, cap)
      .map((k) => entry(section, k));

  const core = pickFor("core", spiked.length ? spiked : ranked.slice(0, 1), 2);
  if (!core.length) core.push({ body: "Leads from the middle of most distributions: adaptable across modes, defined more by context than temperament.", strength: "light" });

  const strengths = pickFor("strengths", spiked, 3);
  if (!strengths.length) strengths.push({ body: "Range: with no spiked trait, fewer trait-driven blind spots — they flex to what the room needs.", strength: "light" });

  const communication = [entry("communication", "E"), entry("communication", "A")];

  const environment = pickFor("environment", ranked.filter((k) => ["O", "C", "A"].includes(k)), 2);

  const frictionKeys = spiked.slice(0, 4);
  const friction = frictionKeys.length
    ? frictionKeys.map((k) => entry("friction", k))
    : [{ body: "No spiked failure mode measured — watch for situational drift rather than trait-driven patterns.", strength: "light" as Strength }];

  const moves = frictionKeys.length
    ? frictionKeys.map((k) => entry("moves", k))
    : [
        { body: "Make agreements explicit and revisit cadence quarterly — balanced profiles drift situationally, not predictably.", strength: "light" as Strength },
        { body: "Calibrate against observation: with no strong trait signal, the field notes below are the real document.", strength: "light" as Strength },
      ];

  return {
    headline: "A working doc generated from the questionnaire — calibrate it against what actually happens.",
    sections: [
      { key: "core", heading: "Core approach", entries: core },
      { key: "strengths", heading: "What they do well", entries: strengths },
      { key: "communication", heading: "How they communicate", entries: communication },
      { key: "environment", heading: "The environment they create", entries: environment },
      { key: "friction", heading: "Friction & failure modes", entries: friction },
      { key: "moves", heading: "Best-practice moves", entries: moves },
    ],
    note: "This default is generated from self-report. Agents working with this person can report observations via MCP (report_collaboration); the weekly field notes outrank the questionnaire wherever they disagree.",
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
