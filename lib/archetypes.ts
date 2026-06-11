import type { ReportKey } from "./types";

// Archetype prototypes in z-space [O, C, E, A, ES, H].
// A narrative layer inspired by empirical trait clustering (Gerlach et al.
// 2018) — always reported with gradient membership, never type-only.
export interface Archetype {
  name: string;
  v: [number, number, number, number, number, number];
  tag: string;
  think: string;
  act: string;
  value: string;
  solve: string;
  blind: string;
  rom: string;
  cof: string;
  role: string;
}

export const ARCHETYPES: Archetype[] = [
  {
    name: "The Architect", v: [1.0, 1.0, -0.5, 0.0, 0.5, 0.5],
    tag: "Deliberate systems-builder: imagination disciplined by structure.",
    think: "In systems and long arcs. You model how parts interact before touching any of them, and you'd rather be slow and right than fast and plausible.",
    act: "Methodically, with plans that survive contact with reality. You under-promise, document, and quietly resent improvisation forced on you.",
    value: "Competence, intellectual honesty, autonomy. Sloppy reasoning bothers you more than disagreement.",
    solve: "Decompose → first principles → design the durable fix, not the patch. You prefer one correct solution over three workarounds.",
    blind: "Over-engineering; deciding too late; reading others' need for speed or reassurance as unseriousness.",
    rom: "Steadiest with partners high in warmth who voice needs directly — you can miss unspoken bids. Your reliability is your love language; say the words too.",
    cof: "Pair with a Catalyst or Driver who sells and decides fast; you keep the machine sound. Risk: two Architects polish forever and ship never.",
    role: "Engineering/architecture, research, strategy, ops design, CTO-type roles.",
  },
  {
    name: "The Catalyst", v: [1.0, 0.0, 1.0, 0.5, 0.3, 0.0],
    tag: "Idea-to-people converter: energy, vision, and momentum.",
    think: "In possibilities and connections. New information is fuel; you think out loud and synthesize across domains.",
    act: "Fast starts, visible enthusiasm, magnetic recruitment of others to the cause. Follow-through depends on who's around you.",
    value: "Growth, novelty, inspiration, being in motion with people you rate.",
    solve: "Reframe the problem, borrow an analogy from another field, prototype in public, iterate from feedback.",
    blind: "Shiny-object switching; underestimating maintenance work; mistaking excitement for commitment.",
    rom: "You bring adventure; you need a partner who is genuinely okay with intensity that comes in waves. Conscientious partners stabilize you — if you let them.",
    cof: "The classic visionary half. Pair with an Operator or Steward who closes loops. Risk: two Catalysts = ten projects, zero invoices.",
    role: "Founding, product vision, evangelism/sales, BD, creative direction.",
  },
  {
    name: "The Steward", v: [0.0, 1.0, 0.0, 1.0, 0.5, 1.0],
    tag: "The trustworthy anchor: duty, warmth, and clean hands.",
    think: "In responsibilities and consequences for people. 'Who is affected, and what did we promise?' comes before 'what is clever?'",
    act: "Consistently. You do what you said, on time, without being watched — and you notice who else does.",
    value: "Integrity, fairness, loyalty, keeping one's word. Your Honesty-Humility profile is your defining asset.",
    solve: "Stabilize first, then fix causes. You prefer proven methods and clear ownership over heroics.",
    blind: "Absorbing others' work silently until resentment; risk-aversion; assuming everyone's word is as good as yours.",
    rom: "High partner-satisfaction profile — stability, warmth and reliability are the three best-evidenced traits a partner can have. Guard against over-giving.",
    cof: "The cofounder everyone *should* want: you make the trust layer of the company. Pair with a Driver/Catalyst for offense. Vet partners' integrity — you project your own onto others.",
    role: "Finance, operations, people leadership, compliance, customer trust, COO-type roles.",
  },
  {
    name: "The Diplomat", v: [0.5, 0.0, 0.8, 1.0, 0.0, 0.5],
    tag: "Social intelligence in motion: the room works because you're in it.",
    think: "In relationships and undercurrents. You read motives and moods quickly and accurately, and think in 'who needs what.'",
    act: "Warmly and adaptively; you broker, translate, and de-escalate. Conflict avoidance is your default setting.",
    value: "Harmony, belonging, being of real use to people you care about.",
    solve: "Through people: find the stakeholders, align incentives, talk it out. You fix the relationship and the problem dissolves.",
    blind: "Saying yes too often; deciding by consensus when someone just needs to decide; deferring hard feedback until it's expensive.",
    rom: "Naturally attuned and generous; your risk is self-erasure. You need a partner who asks what *you* want — and you need to answer.",
    cof: "Glue of any founding team; superb for partnerships, hiring, culture. Pair with someone comfortable being the bad cop. Risk: low-Honesty partners exploit your accommodation.",
    role: "Partnerships, account/customer leadership, talent, comms, chief-of-staff.",
  },
  {
    name: "The Explorer", v: [1.2, -0.8, 0.5, 0.0, 0.3, 0.0],
    tag: "Frontier-runner: curiosity over comfort, motion over maps.",
    think: "Divergently. Constraints feel like suggestions; your best ideas arrive sideways, mid-experience, not at a desk.",
    act: "Improvisationally and bravely. You commit to the interesting before the certain, and you recover from chaos faster than most.",
    value: "Freedom, experience, authenticity. A predictable decade is your nightmare.",
    solve: "Try it. Then try the weirder version. You learn by collision, and your error-recovery is your method.",
    blind: "Structure debt — finishing, filing, maintaining; promising spontaneity others read as unreliability.",
    rom: "Thrilling and present; long-horizon logistics are where friction appears. Works best with secure, flexible partners who don't read novelty-seeking as rejection.",
    cof: "Brilliant 0→1, hazardous 1→10. Pair with a Steward/Operator and give yourself the explore mandate. Risk: low dual-conscientiousness teams stall after the demo.",
    role: "R&D, field work, early product, growth experiments, creative production.",
  },
  {
    name: "The Operator", v: [-0.8, 1.0, 0.0, 0.0, 0.8, 0.3],
    tag: "Calm execution engine: today's plan, done today, no drama.",
    think: "Concretely and practically. You distrust abstractions until they cash out in steps, owners, and dates.",
    act: "With low-noise consistency under pressure — your emotional stability is a genuine competitive advantage.",
    value: "Results, reliability, common sense, deserved rest.",
    solve: "Standardize the repeatable, escalate the exceptional. You make hard things boring, which is the highest operational compliment.",
    blind: "Dismissing unfamiliar ideas too early; mistaking 'works now' for 'will keep working'; under-selling your wins.",
    rom: "A steady, de-dramatizing presence (high partner-satisfaction evidence). Make room for your partner's abstract or emotional explorations — they're not inefficiency.",
    cof: "You convert vision into payroll-meeting reality. Pair with a Catalyst/Architect for direction. Risk: optimizing the current thing while the market moves.",
    role: "Operations, logistics, manufacturing, SRE/infrastructure, GM roles.",
  },
  {
    name: "The Driver", v: [0.3, 0.8, 0.8, -0.8, 0.5, -0.3],
    tag: "Outcome-hungry competitor: speed, will, and a scoreboard.",
    think: "In targets and leverage. You triage fast, tolerate ambiguity, and think 'what wins?' before 'what's ideal?'",
    act: "Decisively, sometimes abrasively. You'd rather apologize than ask permission, and you respect people who push back with substance.",
    value: "Winning, candor, competence, control of your own fate.",
    solve: "Pick the highest-leverage move, commit hard, renegotiate reality later. Analysis is a tool, not a home.",
    blind: "Collateral damage to relationships; hearing disagreement as weakness; ethical gray zones under pressure — watch your own corner-cutting honestly.",
    rom: "Exciting and protective; the friction point is low agreeableness in daily conflict. Partners high in emotional stability fare best; practice repair, not just victory.",
    cof: "You supply velocity and external force. Pair with a high-Honesty Steward who can tell you no — and listen. Two Drivers: great sprint, likely explosion.",
    role: "Sales leadership, CEO/GM, turnarounds, trading, competitive markets.",
  },
  {
    name: "The Scholar", v: [1.0, 0.3, -1.0, 0.0, 0.8, 0.3],
    tag: "Deep, independent mind: signal over noise, depth over reach.",
    think: "Slowly, precisely, alone. You build unusually accurate models in your domains and know exactly where your knowledge ends.",
    act: "Selectively. You spend social energy like the scarce resource it is and do your best work in long, protected stretches.",
    value: "Truth, depth, quiet, intellectual freedom.",
    solve: "Read everything, think hard, emerge with the answer — often the one everyone else missed by moving too fast.",
    blind: "Under-communicating (being right invisibly); avoiding necessary conflict and self-promotion; analysis as procrastination.",
    rom: "Loyal and low-drama with rich inner life; partners may need explicit reassurance that silence isn't distance. Schedule the connection you won't improvise.",
    cof: "Superb technical/insight cofounder. You need an outward-facing partner; agree explicitly on who owns external noise. Risk: conflict avoidance lets problems compound silently.",
    role: "Research, specialist engineering, analysis, writing, science, deep craft.",
  },
];

export interface RankedArchetype extends Archetype {
  match: number; // % of top-3 blend
}

// Nearest-prototype matching with gradient membership: similarity decays
// with Euclidean distance in 6-trait z-space; top-3 blend normalized to 100.
export function matchArchetypes(z: Record<ReportKey, number>): RankedArchetype[] {
  const vec = [z.O, z.C, z.E, z.A, z.ES, z.H];
  const ranked = ARCHETYPES
    .map((a) => {
      const d = Math.sqrt(a.v.reduce((s, p, i) => s + (p - vec[i]) ** 2, 0));
      return { a, sim: Math.pow(1 / (1 + d), 3) };
    })
    .sort((x, y) => y.sim - x.sim);
  const simSum = ranked.slice(0, 3).reduce((s, r) => s + r.sim, 0);
  return ranked.map((r) => ({ ...r.a, match: Math.round((100 * r.sim) / simSum) }));
}

export function archetypeByName(name: string): Archetype | undefined {
  return ARCHETYPES.find((a) => a.name === name);
}

export function trustNote(hPct: number): string {
  if (hPct >= 70) return "High Honesty-Humility — the single best-evidenced predictor of integrity and low exploitation risk (Pletzer et al., 2019). People are right to extend you trust early; your risk is assuming others operate the same way.";
  if (hPct >= 40) return "Mid-range Honesty-Humility — situationally principled, like most people. Your integrity holds when norms and incentives support it; choose environments (and partners) that do.";
  return "Lower Honesty-Humility — comfortable with self-interested angles others avoid. That candor about advantage can be an asset in negotiation, but it is the trait most associated with trust breakdowns in teams; explicit commitments and accountability structures protect your relationships.";
}
