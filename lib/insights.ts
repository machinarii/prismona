import type { Profile, ReportKey } from "./types";
import { TRAIT_LABELS } from "./norms";
import { trustNote } from "./archetypes";

// Dynamic, citation-grounded readings generated from the user's actual trait
// percentiles — the trustNote() pattern generalized across use cases. Text is
// keyed to the same percentile tiers used elsewhere (≥70 high, ≥40 mid, <40
// low) and sharpened with facet-level divergence on the full tier. Every
// section carries an epistemic caveat; nothing here is ever a verdict.

export const USE_CASES = [
  "relationships", "career", "work", "leadership", "integrity", "cofounder",
] as const;
export type UseCase = (typeof USE_CASES)[number];

export interface Insight {
  title: string;
  body: string;
  cite: string;
}

export interface UseCaseSection {
  key: UseCase;
  heading: string;
  insights: Insight[];
  caveat: string;
}

interface Tiered { hi: string; mid: string; lo: string }

const pick = (t: Tiered, pct: number) => (pct >= 70 ? t.hi : pct >= 40 ? t.mid : t.lo);

// Full tier only: name up to two facets that diverge ≥20 percentile points
// from their parent domain — the detail that separates a measured reading
// from a generic one.
function facetNote(p: Profile, domain: ReportKey): string {
  if (p.tier !== "full") return "";
  const dPct = p.traits[domain].pct;
  const diverging = p.facets
    .filter((f) => f.domain === domain && Math.abs(f.pct - dPct) >= 20)
    .sort((a, b) => Math.abs(b.pct - dPct) - Math.abs(a.pct - dPct))
    .slice(0, 2);
  if (!diverging.length) return "";
  const parts = diverging.map(
    (f) => `${f.name} (${f.pct}th percentile) runs well ${f.pct > dPct ? "above" : "below"} your overall ${TRAIT_LABELS[domain]}`,
  );
  return ` Your facet profile sharpens this: ${parts.join("; ")} — weight that nuance over the domain average.`;
}

function relationships(p: Profile): UseCaseSection {
  const t = p.traits;
  return {
    key: "relationships",
    heading: "Close relationships",
    insights: [
      {
        title: "Emotional climate",
        body: pick({
          hi: "Your low emotional reactivity is, by the evidence, the single most valuable thing you bring to a partnership: a partner's emotional stability is the best-replicated trait predictor of relationship satisfaction. You de-escalate by default. Your risk is reading a partner's bigger feelings as a problem to fix rather than weather to share.",
          mid: "Your emotional reactivity sits in the typical range — most days are even, hard weeks wobble. Relationship satisfaction tracks partner stability more than any other trait, so your leverage is in repair speed: how quickly after a spike you return and re-engage matters more than never spiking.",
          lo: "You feel things first and hardest, and the evidence is blunt about the cost: higher negative reactivity is the strongest trait predictor of relationship strain, because stress spills into the space between you. The countermove is also well-evidenced — name the wave early (\"this is my volatility, not us\") and build de-escalation rituals before you need them.",
        }, t.ES.pct) + facetNote(p, "ES"),
        cite: "Malouff et al., 2010; Dyrenforth et al., 2010",
      },
      {
        title: "Warmth and conflict",
        body: pick({
          hi: "High agreeableness makes daily life with you low-friction: you extend goodwill first, and partner agreeableness reliably predicts satisfaction. The shadow side is conflict debt — what you don't raise compounds. Schedule the hard conversations your temperament will otherwise defer.",
          mid: "You balance warmth with self-assertion — you can give ground and hold it. That mid-range agreeableness is workable in either direction; the satisfaction evidence simply asks that disagreement stay respectful in tone, since hostile conflict style erodes bonds faster than the disagreement itself.",
          lo: "You lead with candor over accommodation, and daily conflict is where that bites: lower agreeableness predicts more frequent and hotter friction in close relationships. Your honesty is an asset — but practice repair as deliberately as you practice winning the point.",
        }, t.A.pct) + facetNote(p, "A"),
        cite: "Dyrenforth et al., 2010",
      },
      {
        title: "Reliability as love language",
        body: pick({
          hi: "Your conscientiousness shows up at home as kept promises and carried logistics — and partner conscientiousness is one of the three best-evidenced satisfaction traits. Just say the words too: reliability reads as love only when it's narrated.",
          mid: "You keep the promises that matter and drop some of the small ones. The evidence cares about the pattern, not perfection: consistency on the commitments your partner actually tracks is what converts conscientiousness into felt security.",
          lo: "Structure is not your native language, and in partnership that surfaces as logistics friction — forgotten threads, drifting plans. The fix is externalized systems (shared calendars, standing rituals) so your follow-through doesn't depend on in-the-moment memory.",
        }, t.C.pct) + facetNote(p, "C"),
        cite: "Malouff et al., 2010",
      },
    ],
    caveat: "These are trait priors, not destiny. How a specific relationship feels from the inside — trust, perceived commitment, felt appreciation — predicts its outcome better than either partner's personality (Joel et al., 2020). Use this to choose conversations, never to choose or judge a partner.",
  };
}

function career(p: Profile): UseCaseSection {
  const t = p.traits;
  const growth =
    t.O.pct >= 55 && t.C.pct >= 55
      ? "High openness with high conscientiousness is the rarest and most leveraged combination: you both generate the new and finish it. Compound in roles that reward shipped originality — research with deadlines, product, founding."
      : t.O.pct >= 55
        ? "Your openness outruns your appetite for structure, so your growth curve depends on environments that supply the scaffolding you won't build — strong ops cultures, editors, deadline-driven teams. Protect the exploration; outsource the filing."
        : t.C.pct >= 55
          ? "Your discipline outruns your pull toward novelty, which compounds beautifully in depth careers: mastery of a domain, operational excellence, trust-based seniority. Schedule deliberate exposure to the unfamiliar so the world doesn't move while you perfect the current thing."
          : "You're drawn neither to abstraction nor to structure for its own sake — your growth path is concrete and social: learn by doing, in teams, with visible results. Choose employers for the quality of their on-the-job apprenticeship, not their brand.";
  return {
    key: "career",
    heading: "Career and growth",
    insights: [
      {
        title: "Performance engine",
        body: pick({
          hi: "Conscientiousness is the most general trait predictor of job performance across occupations, and yours is an outlier asset: you deliver without supervision, which is precisely what seniority is made of. Guard against the failure mode of the highly disciplined — mistaking diligence on the current task for strategy about the right task.",
          mid: "Conscientiousness predicts job performance across essentially every occupation, and yours is serviceable rather than distinguishing. That means your edge must come from elsewhere — pick roles where your stronger traits do the predicting, and let checklists and routines cover the gap on the discipline side.",
          lo: "The most consistent trait predictor of job performance is conscientiousness, and yours runs low — in unstructured roles that will tax you. The honest play is environmental: choose work with short feedback loops and external structure (clients, sprints, shows, shifts), where momentum is supplied rather than self-generated.",
        }, t.C.pct) + facetNote(p, "C"),
        cite: "Barrick & Mount, 1991",
      },
      {
        title: "Learning and change",
        body: pick({
          hi: "High openness predicts training proficiency — you learn new domains faster than most and metabolize change rather than merely surviving it. Career-wise that's an option on every industry shift; the discipline is finishing one reinvention before starting the next.",
          mid: "Your openness is mid-range: you adopt the new once it's demonstrably better, which makes you a sane early majority rather than a bleeding-edge gambler. In fast-moving fields, pair with scouts; in stable ones, this is exactly the right setting.",
          lo: "You prefer the proven, and there's real career value in that — depth, reliability, institutional memory. The risk is industry drift: low openness predicts slower retraining, so treat periodic skill audits as maintenance, the way an operator treats equipment.",
        }, t.O.pct) + facetNote(p, "O"),
        cite: "Barrick & Mount, 1991",
      },
      {
        title: "Where you compound",
        body: growth,
        cite: "Roberts et al., 2007",
      },
    ],
    caveat: "Personality predicts career outcomes at modest, real effect sizes — it shapes the slope, not the ceiling. Skills, opportunity, and the market do most of the explaining; use this to pick environments where your defaults are assets, not to cap what you attempt.",
  };
}

function work(p: Profile): UseCaseSection {
  const t = p.traits;
  return {
    key: "work",
    heading: "Work style and job fit",
    insights: [
      {
        title: "Social energy",
        body: pick({
          hi: "You metabolize interaction as fuel: open-plan collaboration, client-facing work, and talk-to-think meetings are where your output rises. Deep solo work is doable but expensive — batch it, and don't accept roles that are eight silent hours a day.",
          mid: "You're an ambivert at work — energized by people in doses, restored by focus in doses. This is the most flexible setting: most role shapes fit, provided neither pure isolation nor wall-to-wall meetings becomes the default.",
          lo: "Interaction spends your energy rather than generating it. Your best work happens in long protected stretches, and your job-fit question is concrete: how many hours of meetings does this role actually require? Roles built on continuous facetime will tax you regardless of how well you mask it.",
        }, t.E.pct) + facetNote(p, "E"),
        cite: "Barrick & Mount, 1991",
      },
      {
        title: "Need for structure",
        body: pick({
          hi: "You generate your own structure — plans, systems, finished loops — which makes you safest in ambiguity and strongest where you own the operating cadence. Beware inheriting chaos indefinitely: you'll silently absorb it instead of renegotiating it.",
          mid: "You work well inside structure and can improvise without it for a while. The fit question is duration: short ambiguous sprints are fine, but a permanently undefined role will slowly tax you — ask who owns process before you sign.",
          lo: "Imposed process feels like friction and self-imposed process rarely sticks — you do your best work where the structure is external and the freedom is internal: clear deliverables, loose methods. Avoid roles where you are the process.",
        }, t.C.pct),
        cite: "Barrick & Mount, 1991",
      },
      {
        title: "Pressure response",
        body: pick({
          hi: "Your stability under load is a genuine occupational asset — incidents, deadlines, and difficult rooms don't degrade your judgment much. High-variance environments (operations, emergency response, markets, leadership) pay a premium for exactly this.",
          mid: "You hold steady under ordinary pressure and wobble under sustained or stacked stress, like most people. Fit-wise, pace matters more than peak: roles with rhythmic intensity and real recovery suit you better than permanent simmer.",
          lo: "Pressure reaches you fast and stays — high-alarm environments will charge you more than they charge others for the same output. That's a fit signal, not a flaw: choose work where excellence is built in calm (craft, analysis, writing, design) and treat recovery time as part of the job.",
        }, t.ES.pct) + facetNote(p, "ES"),
        cite: "Roberts et al., 2007",
      },
    ],
    caveat: "Job fit is a two-sided estimate from one side's data: the same trait is an asset or a liability depending on the actual role design, team, and manager. Treat these readings as interview questions to ask, not as doors closed.",
  };
}

function leadership(p: Profile): UseCaseSection {
  const t = p.traits;
  return {
    key: "leadership",
    heading: "Leadership and teams",
    insights: [
      {
        title: "Leadership emergence",
        body: pick({
          hi: "Extraversion is the strongest Big Five correlate of who gets seen as a leader, and yours means you'll tend to emerge as one whether or not you sought it — rooms hand you the marker. The evidence distinguishes emergence from effectiveness, so spend the visibility you get by default on competence others can audit.",
          mid: "You'll emerge as a leader situationally — when the domain is yours, you speak up; when it isn't, you don't compete for air. That conditional assertion reads as credibility, but in rooms full of louder voices, decide deliberately when silence is consent.",
          lo: "You won't push to emerge, and the research is clear that emergence favors the talkative — which means your leadership, when it happens, will be appointed or earned through demonstrated judgment rather than claimed in the room. Make your thinking visible in writing; it's the introvert's leadership channel.",
        }, t.E.pct) + facetNote(p, "E"),
        cite: "Judge et al., 2002",
      },
      {
        title: "Team role",
        body: pick({
          hi: "You're cooperative tissue — the member who absorbs friction, shares credit, and keeps the team's average high. Team-composition evidence says that genuinely lifts performance. The trap is being the permanent shock absorber: cooperation without boundaries becomes invisible labor.",
          mid: "You cooperate when cooperation is reciprocated and push back when it isn't — a balanced team posture that scales well. Your contribution is keeping exchanges fair; name freeloading early, because you're one of the few who'll do it calmly.",
          lo: "You're the team's challenger: you'd rather be right than liked, and well-run teams need exactly one of you. The composition evidence cuts both ways — challenge lifts decision quality and taxes cohesion — so pick teams secure enough to use you, and aim the candor at ideas, not people.",
        }, t.A.pct) + facetNote(p, "A"),
        cite: "Bell, 2007",
      },
      {
        title: "Composure under load",
        body: pick({
          hi: "Your stability is leadership infrastructure: teams calibrate their alarm to the leader's face, and yours doesn't flinch. That earns trust in crises — just remember to narrate concern you don't display, or people will think you didn't see the risk.",
          mid: "Under normal load you read as steady; under stacked pressure your stress becomes visible — and contagious, because teams amplify a leader's signal. Build the habit of processing spikes offstage before addressing the room.",
          lo: "Your reactivity will be the loudest thing in the room when you lead, because teams amplify whatever the leader emits. That doesn't disqualify you — it means your leadership stack must include deliberate buffering: trusted seconds, decision delays under spike, and honest disclosure of your weather.",
        }, t.ES.pct),
        cite: "Judge et al., 2002",
      },
    ],
    caveat: "Emergence is not effectiveness: the traits that get someone seen as a leader overlap only partly with the ones that make teams perform. Context — task type, team security, organizational incentives — moderates everything here.",
  };
}

function integrity(p: Profile): UseCaseSection {
  const t = p.traits;
  return {
    key: "integrity",
    heading: "Integrity and reliability",
    insights: [
      {
        title: "Trust signal",
        body: trustNote(t.H.pct) + facetNote(p, "H"),
        cite: "Pletzer et al., 2019",
      },
      {
        title: "Dependability",
        body: pick({
          hi: "Your conscientiousness compounds the trust story: you do what you said without being watched, and the workplace evidence ties exactly that pattern to low counterproductive behavior and high citizenship. People can build on your word — that's rarer, and more economically valuable, than talent.",
          mid: "Your follow-through is typical: strong on commitments with visibility and stakes, leakier on the quiet ones. Reputation is built in the unwatched category, so the highest-return habit available to you is closing small loops nobody is tracking.",
          lo: "Low conscientiousness shows up to others as unpredictability — missed threads read as unreliability long before anyone doubts your intent. Protect your reputation structurally: commit to less, externalize tracking, and over-communicate slippage early. Stated honestly, your word needs scaffolding to be as good as you mean it.",
        }, t.C.pct) + facetNote(p, "C"),
        cite: "Pletzer et al., 2019; Barrick & Mount, 1991",
      },
    ],
    caveat: "This reading exists for self-insight and better conversations. It is not a screening instrument and must never be used as a hiring decision or a verdict on a candidate: using personality scores that way requires criterion validation and adverse-impact analysis under the AERA/APA/NCME Standards that a self-report web profile cannot provide.",
  };
}

const BRING: Record<ReportKey, string> = {
  O: "vision — you generate the idea space the company will live in",
  C: "the execution spine — loops close because you exist",
  E: "external force: selling, recruiting, and making the company visible",
  A: "the relational fabric — partnerships, culture, and de-escalation",
  ES: "calm under fire, which a startup consumes in industrial quantities",
  H: "the trust layer — investors, employees, and partners can take your word",
};

const COMPLEMENT: Record<ReportKey, string> = {
  O: "a partner who generates vision and product imagination, so the machine you run has somewhere ambitious to go",
  C: "a partner who closes loops and owns the operational spine — your natural complement, because momentum will not be self-generated",
  E: "an outward-facing partner who owns sales, fundraising, and the room — your natural complement, so you can build where you're strongest",
  A: "a partner who tends the human fabric — hiring, culture, conflict — your natural complement on the people side",
  ES: "a stabilizing partner whose calm is structural, because a startup will spike your reactivity weekly",
  H: "explicit structure more than a person: vesting, written commitments, and accountability a handshake can't provide",
};

function cofounder(p: Profile): UseCaseSection {
  const t = p.traits;
  const keys: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];
  const ranked = [...keys].sort((a, b) => t[b].pct - t[a].pct);
  const strengths = ranked.filter((k) => t[k].pct >= 60).slice(0, 2);
  const gaps = [...ranked].reverse().filter((k) => t[k].pct <= 40).slice(0, 2);
  const bring = strengths.length
    ? `Founder-personality evidence says traits shape venture outcomes, and your strongest contributions are clear: ${strengths.map((k) => BRING[k]).join("; and ")}. Lead with these in how you divide the company — equity follows clarity about who supplies what.`
    : "Your profile is balanced rather than spiked — no single founding superpower, but no structural founding gap either. Your contribution is range: you can hold whichever seat the company is missing this quarter, which is its own kind of rare.";
  const completes = gaps.length
    ? `Your founding gaps are equally clear, and the right cofounder fills them rather than mirrors you: seek ${gaps.map((k) => COMPLEMENT[k]).join("; and ")}. Complementary trait spread beats similarity in founding teams — comfort is what similarity buys, and comfort is not the constraint.`
    : "You have no deep trait gaps, which changes the cofounder question: choose for disjoint skills and shared values rather than trait complementarity, and guard against hiring a mirror — agreement will feel like validation when it's just resemblance.";
  return {
    key: "cofounder",
    heading: "Cofounder fit",
    insights: [
      { title: "What you bring", body: bring, cite: "McCarthy et al., 2023" },
      { title: "Who completes you", body: completes, cite: "Bell, 2007; McCarthy et al., 2023" },
      {
        title: "The trust gate",
        body: pick({
          hi: "Your Honesty-Humility clears the one non-negotiable gate in cofounder selection: trait-level integrity is the strongest known predictor of low exploitation in high-stakes partnerships. The asymmetry to watch is projection — vet a partner's integrity with references and behavior under small temptations, not by assuming they're built like you.",
          mid: "Your integrity is situational in the way most people's is — it holds when structure supports it. In a cofounder bond, that means the structure is the point: clean cap table, vesting, written expectations. Build the partnership so that doing right is also doing easy.",
          lo: "Be honest with yourself about the gray zones you tolerate under pressure — in a cofounder bond, that's where the strongest predictor of partnership breakdown lives. The protective move is voluntary constraint: insist on vesting, transparency, and a partner empowered to call fouls. Structure converts your flexibility from a risk into mere pragmatism.",
        }, t.H.pct),
        cite: "Pletzer et al., 2019; McCarthy et al., 2023",
      },
    ],
    caveat: "A real cofounder read needs both profiles, not one: the dyad evidence is about pairings — dual-low conscientiousness and any low-Honesty pairing are the gates. Exchange share codes and run the comparison; this solo reading is the prior, not the answer.",
  };
}

export function buildInsights(p: Profile): UseCaseSection[] {
  return [relationships(p), career(p), work(p), leadership(p), integrity(p), cofounder(p)];
}
