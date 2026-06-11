import type { DyadReport, Friction, Purpose, ReportKey, ShareProfile } from "./types";
import { normCdf } from "./scoring";

// ---------------------------------------------------------------------------
// Dyad engine (heuristic v0, evidence-aligned per PRD §7).
//
// Romance: actor + partner effects dominate — a partner's emotional
//   stability, agreeableness and conscientiousness predict the other's
//   satisfaction (Malouff 2010; Dyrenforth 2010). Similarity per se adds
//   little, except where large gaps create daily logistics friction.
// Cofounders: complementary trait spreads predict venture success
//   (McCarthy 2023; Bell 2007); dual-low conscientiousness and any
//   low Honesty-Humility pairing are flagged gates (Pletzer 2019).
// Colleagues: a moderated blend — reliability and warmth carry most weight.
//
// Output is always: gauge + strengths + top-3 frictions with structured
// conversation prompts. Never a binary verdict.
// ---------------------------------------------------------------------------

type Z = Record<ReportKey, number>;

interface Candidate extends Friction {
  severity: number; // ranking weight; > 0 means worth surfacing
}

const mean = (a: number, b: number) => (a + b) / 2;
const gap = (a: number, b: number) => Math.abs(a - b);
const zToGauge = (z: number) => Math.round(normCdf(z) * 100);
const clampScore = (n: number) => Math.min(96, Math.max(8, Math.round(n)));

export function compareDyad(me: ShareProfile, them: ShareProfile, purpose: Purpose): DyadReport {
  const a = me.z, b = them.z;
  switch (purpose) {
    case "romantic": return romantic(a, b);
    case "cofounder": return cofounder(a, b);
    case "colleague": return colleague(a, b);
  }
}

function finish(purpose: Purpose, score: number, strengths: string[], candidates: Candidate[]): DyadReport {
  const frictions = candidates
    .filter((c) => c.severity > 0)
    .sort((x, y) => y.severity - x.severity)
    .slice(0, 3)
    .map(({ severity: _severity, ...f }) => f);
  return { purpose, score, headline: headline(purpose, score, frictions.length), strengths: strengths.slice(0, 3), frictions };
}

function headline(purpose: Purpose, score: number, nFrictions: number): string {
  const noun = purpose === "romantic" ? "pairing" : purpose === "cofounder" ? "founding pair" : "working pair";
  if (score >= 75) return `A well-resourced ${noun} — the evidence-based risk factors are largely absent. The frictions below are maintenance items, not structural faults.`;
  if (score >= 55) return `A workable ${noun} with named frictions. None are disqualifying; all of them compound if left unspoken. Run the conversations below early, not after the first conflict.`;
  if (score >= 38) return `A demanding ${noun}. The friction load here is real and will tax both of you; it is manageable only with explicit agreements and honest review. Treat the prompts below as required, not optional.`;
  return `A high-friction ${noun} on the best-evidenced risk factors. Proceed deliberately: this profile pattern predicts recurring conflict without strong external structure. No score is destiny — but go in with eyes open.`;
}

// ----------------------------------------------------------------- romantic

function romantic(a: Z, b: Z): DyadReport {
  // Partner effects, averaged across both directions of the dyad.
  const stability = mean(a.ES, b.ES);
  const warmth = mean(a.A, b.A);
  const reliability = mean(a.C, b.C);
  const core = 0.45 * stability + 0.32 * warmth + 0.23 * reliability;

  let score = zToGauge(core * 0.9);
  const strengths: string[] = [];
  const candidates: Candidate[] = [];

  if (stability > 0.4) strengths.push("Shared emotional stability — the single best-evidenced foundation for mutual satisfaction. Conflicts in this pairing tend to stay proportionate.");
  if (warmth > 0.4) strengths.push("High combined warmth: both of you default to generous interpretations, which is what repair attempts need to land.");
  if (reliability > 0.4) strengths.push("Mutual reliability — promises kept on both sides keeps trust cheap to maintain.");
  if (Math.min(a.H, b.H) > 0.4) strengths.push("Both high in Honesty-Humility: low exploitation risk, straight dealing on money and commitments.");
  if (gap(a.O, b.O) < 0.6 && mean(a.O, b.O) > 0.3) strengths.push("Aligned openness: you will want the same amount of novelty in life — travel, ideas, change — which removes a chronic quiet tension.");
  if (!strengths.length) strengths.push("No standout shared resource on the measured traits — your strengths likely live in history, values and circumstance, which this instrument does not see.");

  const lowES = Math.min(a.ES, b.ES);
  if (lowES < -0.5) {
    const both = a.ES < -0.5 && b.ES < -0.5;
    candidates.push({
      severity: 3 + (both ? 1.5 : 0) - lowES,
      title: both ? "Double volatility load" : "Asymmetric volatility load",
      body: both
        ? "Both of you sit low on emotional stability. Neuroticism is the strongest single risk factor for relationship dissatisfaction — and with two reactive nervous systems, small triggers can cascade because neither partner is reliably the calm one."
        : "One of you carries notably lower emotional stability. The steadier partner will often absorb de-escalation work; unacknowledged, that drifts into caretaker resentment on one side and feeling 'managed' on the other.",
      prompt: "15 minutes, separately then together: each of you writes your three most recent overreactions and what the trigger actually was underneath. Swap lists. Agree on one concrete 'circuit breaker' each — a phrase or action either of you can deploy mid-spiral that the other commits to honoring without debate.",
    });
    score -= both ? 10 : 5;
  }
  if (a.A < -0.5 && b.A < -0.5) {
    candidates.push({
      severity: 3.5,
      title: "Conflict escalation risk",
      body: "Both of you score low on agreeableness. You'll respect each other's bluntness — and you'll also fight to win rather than to repair. The evidence is clear that contempt-adjacent conflict styles, not conflict itself, predict deterioration.",
      prompt: "Set a standing rule before the next disagreement: the winner of any argument must restate the loser's position to their satisfaction first. Practice once now on a low-stakes disagreement (where to live, how to spend a free Saturday). 15 minutes.",
    });
    score -= 8;
  }
  const cGap = gap(a.C, b.C);
  if (cGap > 1.2) {
    candidates.push({
      severity: 1.5 + cGap,
      title: "Order vs. spontaneity gap",
      body: "A large conscientiousness gap means one of you experiences the other as chaotic, and is experienced in return as controlling. This shows up in chores, money, and planning — the unglamorous daily surface where most resentment actually accrues.",
      prompt: "List the five recurring logistics of your shared life (cleaning, money, plans, time-keeping, admin). For each: who owns it outright? Ownership — not fairness-by-halves — is the evidence-aligned fix. 15 minutes, revisit quarterly.",
    });
  }
  const eGap = gap(a.E, b.E);
  if (eGap > 1.4) {
    candidates.push({
      severity: 0.5 + eGap * 0.8,
      title: "Social-energy mismatch",
      body: "One of you recharges in company, the other in quiet. Neither is wrong; untreated, the extravert feels caged and the introvert feels dragged. This is a scheduling problem masquerading as a love problem.",
      prompt: "Design your default week together: how many social nights, how many quiet ones, and — critically — permission language for solo plans that doesn't require an excuse. 15 minutes.",
    });
  }
  const lowH = Math.min(a.H, b.H);
  if (lowH < -0.6) {
    candidates.push({
      severity: 2.5 - lowH,
      title: "Trust architecture needed",
      body: "One of you scores low on Honesty-Humility — comfort with self-interested angles. In romance this is the trait most associated with boundary-pushing around money, exes, and commitments. Not a verdict; a known risk pattern that explicit agreements neutralize.",
      prompt: "Each partner names the two areas where they most need predictability (money, exclusivity, time, information). Write the actual agreement down in plain words. Vague trust is what low-H exploits; explicit trust is what it respects. 15 minutes.",
    });
    score -= 6;
  }
  const oGap = gap(a.O, b.O);
  if (oGap > 1.4) {
    candidates.push({
      severity: oGap * 0.7,
      title: "Novelty appetite divergence",
      body: "A wide openness gap: one of you treats change as oxygen, the other as cost. Over years this becomes the 'we never do anything' / 'nothing is ever enough' loop.",
      prompt: "Each writes their ideal ordinary month — then highlight the lines that genuinely conflict (usually fewer than feared). Agree one recurring 'their world' ritual in each direction. 15 minutes.",
    });
  }

  return finish("romantic", clampScore(score), strengths, candidates);
}

// ---------------------------------------------------------------- cofounder

function cofounder(a: Z, b: Z): DyadReport {
  const minH = Math.min(a.H, b.H);
  const maxC = Math.max(a.C, b.C);
  // Complementary spread across O/E/C predicts venture success (McCarthy 2023).
  const diversity = (gap(a.O, b.O) + gap(a.E, b.E) + gap(a.C, b.C)) / 3;
  const stability = mean(a.ES, b.ES);

  let score = 50
    + 14 * Math.max(-1.5, Math.min(1, minH))    // trust floor
    + 10 * Math.max(-1.5, Math.min(1, maxC))    // execution floor
    + 12 * Math.min(1.2, diversity)             // complementarity bonus
    + 6 * Math.max(-1, Math.min(1, stability)); // pressure tolerance

  const strengths: string[] = [];
  const candidates: Candidate[] = [];

  if (minH > 0.3) strengths.push("A high-trust pair: both of you sit high on Honesty-Humility, the strongest known predictor of clean dealing under pressure. Equity, credit and money conversations will be cheaper here than in most founding teams.");
  if (diversity > 0.8) strengths.push("Genuinely complementary profiles — founder-personality diversity of this kind is associated with materially higher venture success odds. You will disagree usefully and cover more of the company's surface area.");
  if (maxC > 0.5) strengths.push("At least one strong finisher: the execution floor of this team is covered. Route deadlines and operational truth through that person by default.");
  if (stability > 0.4) strengths.push("Both calm under load — fundraising swings and near-death weeks will strain the company, not the partnership.");
  if (gap(a.E, b.E) > 1.0) strengths.push("Natural inside/outside split: one of you is built for the room, the other for the work. Make the division explicit and it becomes an asset rather than an imbalance grievance.");
  if (!strengths.length) strengths.push("Similar profiles — comfortable to work in, but you will compete for the same role and share the same blind spots. Compensate with explicit role boundaries and an outside voice you both trust.");

  if (minH < -0.5) {
    candidates.push({
      severity: 5 - minH,
      title: "Trust risk — the one gate we flag hardest",
      body: "One of you scores low on Honesty-Humility. In founding teams this is the trait most associated with side deals, credit-taking, and term renegotiation when leverage shifts. It does not mean this person will defect — it means the partnership should not run on implicit trust.",
      prompt: "Before incorporating anything: 30 minutes with the actual documents. Vesting with a cliff for both founders, no exceptions; written IP assignment; agreed information rights. High-trust pairs do this too — for this pair it is the difference between a risk and a time bomb.",
    });
    score -= 10;
  }
  if (a.C < -0.4 && b.C < -0.4) {
    candidates.push({
      severity: 4.2,
      title: "Dual-low conscientiousness — the stall pattern",
      body: "Neither of you is a natural finisher. This is the classic 'brilliant demo, no invoices' team: ideation outruns shipping, and operational debt accumulates silently until it's existential. The research flags this combination specifically.",
      prompt: "15 minutes, brutal honesty: list everything currently 'in progress.' Kill half. For the survivors, name one owner and one shipping date each. Then decide which external structure you'll buy — a weekly accountability review, an early ops hire, a board cadence — because internal discipline is not this team's endowment.",
    });
    score -= 8;
  }
  if (a.A < -0.4 && b.A < -0.4) {
    candidates.push({
      severity: 3 + Math.min(1.5, (-a.ES - b.ES) / 2),
      title: "Two hard heads, no shock absorber",
      body: "Both low on agreeableness: decisions will be contested with full force, which sharpens strategy right up until it fractures the partnership. Low-A pairs do well only with a decision protocol that ends fights cleanly.",
      prompt: "Agree the disagreement protocol now, in writing: who holds the tiebreak in which domain (product, money, people), and what 'disagree and commit' actually obligates the loser to do. Test it on a live current disagreement. 20 minutes.",
    });
    score -= 5;
  } else if ((a.A < -0.6 && b.ES < -0.5) || (b.A < -0.6 && a.ES < -0.5)) {
    candidates.push({
      severity: 2.8,
      title: "Abrasion against a reactive surface",
      body: "One of you is blunt to the point of abrasive; the other is emotionally reactive. The blunt one will keep 'just being honest'; the reactive one will keep a ledger. This A×stability interaction is the most common slow-burn founder rupture.",
      prompt: "Each names the one phrase or behavior from the other that lands worst, and proposes the exact substitute they could accept. Trade. Write both down. 15 minutes, revisit after your next heated week.",
    });
  }
  if (diversity < 0.4) {
    candidates.push({
      severity: 2.2,
      title: "Mirror-image team",
      body: "Your trait profiles are unusually similar. Pleasant, fast-bonding — and structurally fragile: shared blind spots go unchallenged, and you'll both gravitate to the same work while the complement goes undone.",
      prompt: "List the company's six core functions (build, sell, fund, operate, support, decide). Mark which excite each of you. The unclaimed ones are your first hire or your standing external advisor — name which, with a date. 15 minutes.",
    });
  }
  if (gap(a.O, b.O) > 1.6) {
    candidates.push({
      severity: 1.6,
      title: "Vision-horizon mismatch",
      body: "A very large openness gap: one of you wants to reinvent the category, the other to execute the known playbook. Both build companies; they build different companies. Unresolved, every roadmap meeting relitigates strategy.",
      prompt: "Each writes the three-year version of the company in five sentences. Compare. Where the documents conflict, decide now which view wins by default — and what evidence would flip it. 20 minutes.",
    });
  }

  return finish("cofounder", clampScore(score), strengths, candidates);
}

// ---------------------------------------------------------------- colleague

function colleague(a: Z, b: Z): DyadReport {
  const reliability = mean(a.C, b.C);
  const warmth = mean(a.A, b.A);
  const stability = mean(a.ES, b.ES);
  let score = zToGauge(0.4 * reliability + 0.35 * warmth + 0.25 * stability);

  const strengths: string[] = [];
  const candidates: Candidate[] = [];

  if (reliability > 0.4) strengths.push("Mutual reliability: handoffs between you will be clean, and neither will quietly carry the other.");
  if (warmth > 0.4) strengths.push("Good faith on both sides — feedback and credit-sharing will default to generous readings.");
  if (stability > 0.4) strengths.push("Both steady under deadline pressure; crunch weeks won't turn interpersonal.");
  if (Math.min(a.H, b.H) > 0.3) strengths.push("High mutual integrity: low political overhead — what's said in the room matches what's done outside it.");
  if (gap(a.E, b.E) > 1.0) strengths.push("Complementary visibility: one of you naturally fronts the work, the other deepens it. Name the split and both get credit.");
  if (!strengths.length) strengths.push("No standout shared resource on the measured traits; this pairing will run on process quality more than natural chemistry.");

  const cGap = gap(a.C, b.C);
  if (cGap > 1.2) {
    candidates.push({
      severity: 2 + cGap,
      title: "Standards gap",
      body: "A large conscientiousness gap between collaborators is the most common source of quiet resentment: one rechecks the other's work, the other feels micromanaged. It is structural, not moral.",
      prompt: "Define 'done' together for your three most common deliverable types — literally a checklist each. The high-C partner writes the first draft; the other edits for realism. 15 minutes.",
    });
  }
  if (a.A < -0.5 && b.A < -0.5) {
    candidates.push({
      severity: 2.6,
      title: "Friction-prone communication",
      body: "Both of you are blunt and competitive. Productive at its best; corrosive over email. Disagreements between low-A colleagues escalate fastest in writing, where tone is read at its worst.",
      prompt: "Adopt one rule: any disagreement that survives two written exchanges moves to a 10-minute call. Try it on the next one. Agree now what topics are call-first by default.",
    });
    score -= 6;
  }
  if (Math.min(a.ES, b.ES) < -0.7) {
    candidates.push({
      severity: 2.2,
      title: "Pressure amplification",
      body: "At least one of you runs anxious under load. In colleague pairs this surfaces as urgency inflation — everything marked critical — which trains the other to discount real alarms.",
      prompt: "Agree a three-level urgency vocabulary (today / this week / when you can) and commit to using the words literally. 10 minutes, then police it kindly for a month.",
    });
  }
  if (Math.min(a.H, b.H) < -0.6) {
    candidates.push({
      severity: 2.4,
      title: "Credit and information hygiene",
      body: "One of you scores low on Honesty-Humility; in workplace pairs that pattern correlates with credit capture and selective information flow. Protect the collaboration with visible process rather than suspicion.",
      prompt: "Default to shared artifacts: joint docs, cc'd updates, decisions written where both can see them. Agree this as a working style now — framed as efficiency, enforced as protection. 10 minutes.",
    });
    score -= 5;
  }
  if (gap(a.O, b.O) > 1.6) {
    candidates.push({
      severity: 1.4,
      title: "Method mismatch",
      body: "One of you wants to try the new way; the other trusts the proven way. Untreated, you'll each read the other as reckless or stale respectively.",
      prompt: "Split your shared work explicitly: which streams run on the playbook, which one stream is the sanctioned experiment. Review the split monthly. 10 minutes.",
    });
  }

  return finish("colleague", clampScore(score), strengths, candidates);
}
