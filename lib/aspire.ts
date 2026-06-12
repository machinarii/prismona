import type { Profile, ReportKey } from "./types";
import { TRAIT_LABELS } from "./norms";

// The desired self, treated as self-development rather than wish-making.
// Grounding: actual/ideal discrepancies are psychologically consequential
// (Higgins, 1987; Rogers' congruence), desired future selves motivate
// behavior (Markus & Nurius, 1986), and traits respond to volitional change
// goals WHEN paired with concrete behavioral steps — slowly, in months, at
// modest magnitudes (Hudson & Fraley, 2015). The mechanics here are honest
// about all three: congruence inside the measurement band is celebrated, the
// focus is one trait at a time, and the practices are Hudson-style if-then
// behaviors, not affirmations.

const KEYS: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];
const AMBITION_GUARD = 35; // percentile points

export interface DesiredSelf {
  v: 1;
  date: string;
  targets: Record<ReportKey, number>; // desired percentiles
}

export interface TraitDiscrepancy {
  actual: number;
  desired: number;
  gap: number; // |desired − actual|
  direction: "up" | "down" | "hold";
  congruent: boolean; // desired sits inside the actual's ±1 SEM band
}

export interface DiscrepancyReport {
  perTrait: Record<ReportKey, TraitDiscrepancy>;
  focus: ReportKey | null; // largest non-congruent gap
  focusDirection: "up" | "down";
  note: string;
}

export function discrepancyReport(p: Profile, targets: Record<ReportKey, number>): DiscrepancyReport {
  const perTrait = {} as Record<ReportKey, TraitDiscrepancy>;
  KEYS.forEach((k) => {
    const t = p.traits[k];
    const desired = Math.min(99, Math.max(1, Math.round(targets[k])));
    const gap = Math.abs(desired - t.pct);
    const congruent = desired >= t.lo && desired <= t.hi;
    perTrait[k] = {
      actual: t.pct,
      desired,
      gap,
      direction: congruent ? "hold" : desired > t.pct ? "up" : "down",
      congruent,
    };
  });
  const ranked = KEYS.filter((k) => !perTrait[k].congruent)
    .sort((a, b) => perTrait[b].gap - perTrait[a].gap);
  const focus = ranked[0] ?? null;
  const maxGap = focus ? perTrait[focus].gap : 0;
  const note = !focus
    ? "Your desired self sits inside the measurement's own uncertainty on every trait — congruence, in Rogers' sense. The work now is acceptance and maintenance, not change; revisit after your next retest."
    : maxGap > AMBITION_GUARD
      ? `An ambitious gap: ${maxGap} percentile points on ${TRAIT_LABELS[focus]}. The change evidence is encouraging but humble — traits move in small, incremental steps over months of practiced behavior, not weeks of intention (Hudson & Fraley, 2015). Keep the destination; measure progress against your retest trajectory, not against the goal.`
      : `Clear focus: ${TRAIT_LABELS[focus]}, ${perTrait[focus].direction === "up" ? "growing" : "easing"} ${maxGap} percentile points. That is movable territory — with weekly behavioral practice, not intention alone (Hudson & Fraley, 2015).`;
  return { perTrait, focus, focusDirection: focus ? (perTrait[focus].direction as "up" | "down") : "up", note };
}

export interface DevelopmentPlan {
  trait: ReportKey;
  goal: string;
  why: string;
  weekly: string[];
}

const WHY_BASE = "Trait change goals work when tied to concrete, repeatable behaviors — in the trials, people who completed weekly behavioral challenges moved measurably on the targeted trait over months, while intention alone moved nothing (Hudson & Fraley, 2015";

const PLANS: Record<ReportKey, { up: { goal: string; weekly: string[] }; down: { goal: string; weekly: string[] } }> = {
  O: {
    up: {
      goal: "Widen the aperture: more novelty, more ideas",
      weekly: [
        "Consume one substantial piece outside your usual lane (a paper, film, or essay from a field you never visit) and write three sentences on it",
        "Take one familiar routine — route, meal, tool — and deliberately do it a different way",
        "In one meeting, propose the unconventional option out loud before the safe one",
      ],
    },
    down: {
      goal: "Trade breadth for depth and follow-through",
      weekly: [
        "Pick the proven approach over the novel one for every low-stakes decision this week, and note what it cost you (usually: nothing)",
        "Close one open exploration — write its conclusion and archive it",
        "Before starting anything new, finish or formally drop one existing thread",
      ],
    },
  },
  C: {
    up: {
      goal: "Build the execution spine",
      weekly: [
        "Every evening, write tomorrow's three concrete next actions — and start the day on the first one before opening anything else",
        "Apply the two-minute rule: anything under two minutes gets done the moment it appears",
        "Close one loop you've been avoiding, and tell someone it's closed",
      ],
    },
    down: {
      goal: "Loosen the grip: done over perfect",
      weekly: [
        "Ship one thing at 90% and observe that nothing breaks",
        "Delegate one task you'd normally control, with outcomes only — no method instructions",
        "Leave one evening fully unplanned, on purpose",
      ],
    },
  },
  E: {
    up: {
      goal: "Spend more social energy, on purpose",
      weekly: [
        "Speak within the first five minutes of one meeting where you'd normally stay quiet",
        "Initiate one conversation with someone you don't know — a question is enough",
        "Say yes to one gathering you'd reflexively decline, and stay one hour",
      ],
    },
    down: {
      goal: "Protect depth: fewer rooms, more focus",
      weekly: [
        "Block two two-hour deep-work windows and defend them like meetings",
        "Decline one optional meeting and send written input instead",
        "Practice the pause: in one discussion, wait three seconds before filling the silence",
      ],
    },
  },
  A: {
    up: {
      goal: "Lead with warmth before verdict",
      weekly: [
        "In one disagreement, state the other person's position to their satisfaction before arguing yours",
        "Give one piece of unprompted, specific appreciation",
        "Catch one sharp reply before sending; rewrite it softer without losing the point",
      ],
    },
    down: {
      goal: "Reclaim the no: candor over accommodation",
      weekly: [
        "Decline one request you'd normally absorb, without apology or a manufactured excuse",
        "Voice one disagreement in the meeting instead of after it",
        "Ask directly for one thing you want this week, stated plainly",
      ],
    },
  },
  ES: {
    up: {
      goal: "Lengthen the fuse: steadier under load",
      weekly: [
        "When a stress spike hits, name it in writing (one sentence) before responding to anyone",
        "Defer one non-urgent decision made under agitation to the next morning",
        "Practice one daily off-ramp — a walk, breath protocol, or hard stop — at the same time each day",
      ],
    },
    down: {
      goal: "Let appropriate urgency register",
      weekly: [
        "Ask one colleague what they're worried about that you're not — and sit with it before reassuring",
        "Set one deadline closer than comfortable and honor it",
        "Name one risk out loud that your calm has been smoothing over",
      ],
    },
  },
  H: {
    up: {
      goal: "Tighten the integrity habit",
      weekly: [
        "Keep one small promise you'd normally let quietly slide, at personal cost",
        "Correct one exaggeration in your own favor — out loud, where it was made",
        "Give credit by name once where you could have absorbed it",
      ],
    },
    down: {
      goal: "Advocate for yourself without apology",
      weekly: [
        "State your actual contribution plainly in one setting where you'd normally deflect",
        "Negotiate one small thing you'd usually accept as offered",
        "Accept one compliment with only 'thank you'",
      ],
    },
  },
};

export function developmentPlan(trait: ReportKey, direction: "up" | "down"): DevelopmentPlan {
  const plan = PLANS[trait][direction];
  return {
    trait,
    goal: plan.goal,
    why: `${WHY_BASE}). For ${TRAIT_LABELS[trait]}, the practices below are the trial-style weekly challenges — small, behavioral, repeatable.`,
    weekly: plan.weekly,
  };
}

export function growthAddendum(r: DiscrepancyReport): string {
  if (!r.focus) return "";
  const d = r.perTrait[r.focus];
  const plan = developmentPlan(r.focus, r.focusDirection);
  return `GROWTH ADDENDUM (paste alongside the companion persona)

I am working on ${TRAIT_LABELS[r.focus]}: currently ${d.actual}th percentile, aiming ${r.focusDirection === "up" ? "higher" : "lower"} (toward ${d.desired}th). Goal: ${plan.goal.toLowerCase()}.

How to support this: weave my weekly practices into our work naturally — ${plan.weekly.map((w) => w.toLowerCase()).join("; ")}. Notice and name it when I do the new behavior; connect tasks to the practice when the fit is real.

Boundaries: support the practice, never nag about lapses, never moralize, and never frame my current standing as a deficiency — trait change is slow and incremental (Hudson & Fraley, 2015), and the goal is mine, not yours to enforce.`;
}
