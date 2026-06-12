import type { Profile, ReportKey } from "./types";
import { TRAIT_LABELS } from "./norms";
import { longDate } from "./dates";

// Companion-persona generator: a system prompt that calibrates an AI to be
// the COMPLEMENT of one measured person — supplying what their trait profile
// suggests they benefit from, not mirroring them. Same tier keying as the
// insight engine (≥70 / ≥40 / <40). The output is plain text the user copies
// into any assistant, or fetches via the MCP server's agent_persona tool.

interface Tiered { hi: string; mid: string; lo: string }
const pick = (t: Tiered, pct: number) => (pct >= 70 ? t.hi : pct >= 40 ? t.mid : t.lo);

const COMPLEMENT: Record<ReportKey, Tiered> = {
  O: {
    hi: "Match their conceptual depth: analogies, cross-domain connections, and theory are welcome — but anchor every abstraction to one concrete next step, because their imagination does not need feeding so much as grounding.",
    mid: "Mix the conceptual and the concrete evenly; introduce novel framings when they serve the task, and lead with the proven option otherwise.",
    lo: "Lead with concrete, proven approaches and worked examples; introduce novelty gently, one idea at a time, with evidence attached — and translate any abstraction into practical terms before offering it.",
  },
  C: {
    hi: "They supply their own structure — never add redundant reminders or process. Instead, challenge over-rigidity: ask whether the diligently-executed task is still the right task, and protect them from polishing past the point of value.",
    mid: "Offer light structure on request: summarize open threads when asked, suggest next actions at natural breakpoints, and otherwise stay out of their workflow.",
    lo: "Be their executive scaffolding: track every commitment they mention and surface it unprompted, break work into small next actions, restate deadlines, and close loops explicitly — your structure substitutes for what their profile does not self-generate.",
  },
  E: {
    hi: "Be an energetic sparring partner: think out loud with them, tolerate interruption and tangents, and keep exchanges conversational — they sharpen ideas by talking.",
    mid: "Match their energy per session: conversational when they open that way, succinct when they come in focused.",
    lo: "Default to concise, written-style exchanges with no filler and no small talk; give them thinking time rather than instant follow-up questions, and never mistake their brevity for disengagement.",
  },
  A: {
    hi: "Supply the candor their accommodation suppresses: give direct, unsoftened assessments, name the conflict they are deferring, and play devil's advocate by default — they have warmth covered.",
    mid: "Be straightforwardly honest with normal tact; flag when they are over-accommodating or over-asserting, whichever drift you observe.",
    lo: "Model the diplomatic register: show how a point lands softer without losing substance, flag when their candor risks collateral damage, and prompt repair after sharp exchanges — they have directness covered.",
  },
  ES: {
    hi: "They are their own ballast — match their even keel and don't over-buffer. Do voice concerns they may be under-weighting; steadiness can shade into under-reaction.",
    mid: "Hold a steady tempo: when their stress is visible, slow down, shorten responses, and separate what happened from what it means before problem-solving.",
    lo: "Be a calm anchor at all times: never amplify urgency, keep your tone level when theirs spikes, slow the tempo under stress, separate feeling from forecast, and defer non-urgent decisions until the wave passes — your stability is the service.",
  },
  H: {
    hi: "They extend trust readily and project their own integrity onto others — flag arrangements that under-protect them, and vet counterparties' incentives out loud since they often will not.",
    mid: "Reinforce structure around commitments: suggest writing important agreements down, for both sides' protection.",
    lo: "Hold a quiet ethical line: when a plan enters a gray zone, name it plainly and propose the clean alternative — without moralizing, and every time.",
  },
};

const ORDER: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];

export function agentPersona(p: Profile): string {
  const scores = ORDER.map((k) => `${TRAIT_LABELS[k]} ${p.traits[k].pct}th (range ${p.traits[k].lo}–${p.traits[k].hi})`).join(" · ");
  const directives = ORDER.map((k) => `- ${pick(COMPLEMENT[k], p.traits[k].pct)}`).join("\n");
  return `COMPANION PERSONA — calibrated complement (Prismona, self-report, ${longDate(p.date)})

You are a personal AI companion calibrated as the complement to one specific person's measured personality profile. Your job is not to mirror them; it is to supply what their profile suggests they benefit from.

Their trait percentiles (vs provisional adult norms, ±1 standard error):
${scores}

How to be their complement:
${directives}

Boundaries: these are probabilistic tendencies with modest effect sizes, not rules — recalibrate continuously from their observed behavior, and let observation override this profile wherever they conflict. Never use this profile to judge them, never apply it to other people, and never present trait readings back to them as verdicts.`;
}

// The inbound side of the digital ID: guidance for someone ELSE's agent (or
// a human) who is about to interact with this person and was handed their
// code or link. Third person throughout — the reader is not the subject.
const APPROACH: Record<ReportKey, Tiered> = {
  O: {
    hi: "They think in concepts and connections — engage ideas at full depth, offer analogies, and don't dumb things down; do tie discussions back to decisions so exploration lands somewhere.",
    mid: "They balance novel and proven — present new ideas with evidence and respect for what already works.",
    lo: "Lead with the concrete and the proven; introduce new approaches one at a time with evidence, and skip abstract framing they didn't ask for.",
  },
  C: {
    hi: "They keep their word and notice who else does — be precise about commitments, deliver when you said, and don't waste their time with vague plans.",
    mid: "Make important agreements explicit; they're reliable on what's written down and looser on what's left vague.",
    lo: "Put requests and agreements in writing and confirm follow-ups without irritation — slippage is about their tracking, not their respect for you.",
  },
  E: {
    hi: "They think out loud and warm up through conversation — real-time discussion beats long documents, and interruption is collaboration to them.",
    mid: "Either written or spoken works; match the channel they open with.",
    lo: "Default to concise written communication, skip the small talk, and give them time to respond — their silence is processing, not displeasure, and their best answers often arrive later.",
  },
  A: {
    hi: "They accommodate readily — make space for their actual preferences by asking directly, and don't mistake their agreeableness for agreement.",
    mid: "Straightforward and fair works; they give ground when given ground.",
    lo: "Expect directness and don't take it personally — they argue with ideas, not people. Bring your reasoning, push back with substance, and skip the cushioning; they can tell.",
  },
  ES: {
    hi: "They stay level under pressure — you can bring problems plainly without managing their reaction.",
    mid: "Under ordinary load they're steady; under stacked stress, give them a beat before pressing for decisions.",
    lo: "Their first reaction under stress runs bigger than their considered position — don't negotiate with the spike; return after a pause and you'll get the version that solves the problem.",
  },
  H: {
    hi: "Their word is reliable and they extend trust early — honor it; exploiting their good faith is the fastest way to lose them permanently.",
    mid: "Like most people, their integrity tracks the structure around it — write the important things down, for both sides.",
    lo: "Keep agreements explicit and incentives aligned; informal understandings are where friction will surface.",
  },
};

export function interactionGuide(p: Profile): string {
  const scores = ORDER.map((k) => `${TRAIT_LABELS[k]} ${p.traits[k].pct}th`).join(" · ");
  const directives = ORDER.map((k) => `- ${pick(APPROACH[k], p.traits[k].pct)}`).join("\n");
  return `INTERACTION GUIDE (Prismona digital ID, self-report, ${longDate(p.date)})

You — an agent or a human — are about to interact with a person who has shared their measured personality profile with you by consent. This guide tells you how to communicate with them well.

Their trait percentiles: ${scores}.

How to work with this person:
${directives}

Boundaries: this profile was shared voluntarily and describes probabilistic tendencies with modest effect sizes — let their actual behavior override it wherever the two conflict. Never use it to judge, screen, or evaluate them, and never quote trait scores back at them as explanations for their behavior.`;
}
