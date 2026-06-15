import type { Profile } from "./types";
import { valueWorkEntries, type ValuesProfile } from "./values";

// "Working with me" manual: a first-person, shareable one-pager generated
// from actual trait percentiles. Same three-tier keying as lib/insights.ts
// (≥70 high, ≥40 mid, <40 low), deliberately domain-level — no facets — so
// it prints on one page and reads as a handout, not a report.

export interface ManualEntry { title: string; body: string }
export interface ManualSection { key: string; heading: string; entries: ManualEntry[] }

interface Tiered { hi: string; mid: string; lo: string }
const pick = (t: Tiered, pct: number) => (pct >= 70 ? t.hi : pct >= 40 ? t.mid : t.lo);

export function buildManual(p: Profile, values?: ValuesProfile | null): ManualSection[] {
  const t = p.traits;
  const sections: ManualSection[] = [
    {
      key: "communication",
      heading: "How I communicate",
      entries: [
        {
          title: "Default mode",
          body: pick({
            hi: "I think out loud — my first version of an idea arrives mid-sentence, and talking is how I sharpen it. Don't hold me to the first draft I say; do interrupt me, that's collaboration, not rudeness.",
            mid: "I switch between talking and writing depending on the stakes: quick things live in conversation, anything consequential I'd rather see written. If a discussion matters, send me an agenda and I'll come prepared.",
            lo: "I think first and speak after, so my silence in a meeting is processing, not absence or disagreement. My best contributions often come in writing or a day later — leave a channel open for that and you'll get my real answer.",
          }, t.E.pct),
        },
        {
          title: "Directness",
          body: pick({
            hi: "I default to tact — I'll soften messages to protect the relationship. If you need my unvarnished view, ask for it explicitly; I have one, and I'll give it when invited.",
            mid: "I calibrate candor to the situation: direct when it's safe and useful, diplomatic when the room needs it. Plain questions get plain answers from me.",
            lo: "I'm blunt by default and I say the thing others are thinking. It's never personal — I argue with ideas, not people — but tell me if the delivery lands harder than I intend, and I'll adjust.",
          }, t.A.pct),
        },
        {
          title: "Candor",
          body: pick({
            hi: "I say the straight version and assume you will too — I read positioning and politics as a tax on the work. Give me the real state of things; I'd rather have the hard truth than a managed one, and I'll share credit and own my mistakes first.",
            mid: "I'm honest but tactful — I'll tell you what I think without making it a weapon, and I expect the same plain dealing back. Straight talk builds trust with me fast.",
            lo: "I'm comfortable with strategic framing and working an angle, so put what matters in writing and keep commitments explicit — a handshake where a contract belongs is where friction will start.",
          }, t.H.pct),
        },
      ],
    },
    {
      key: "decisions",
      heading: "How I decide",
      entries: [
        {
          title: "Speed and inputs",
          body: pick({
            hi: "I decide with a plan behind it: give me the inputs and a deadline and I'll deliver a reasoned call on time. I distrust decisions made purely on momentum, so if we're moving fast, tell me which corners we're consciously cutting.",
            mid: "I balance analysis and motion: enough data to be defensible, not so much that the window closes. If I'm stalling, ask me what single piece of information would settle it — that usually unsticks me.",
            lo: "I decide by moving — I'd rather run a cheap experiment than perfect a forecast. Pair me with someone who guards the irreversible decisions, and give me the reversible ones to run fast.",
          }, t.C.pct),
        },
        {
          title: "Novel vs. proven",
          body: pick({
            hi: "I'm drawn to the new way before the proven way, and I'm genuinely good at imagining how it could work. Check me by asking what the boring solution would be — I sometimes skip it.",
            mid: "I'll adopt new approaches once someone shows me they work, and stick with proven ones until then. I'm the right person to sanity-check both the enthusiasts and the skeptics.",
            lo: "I trust what has worked before, and I'm usually the one who remembers why the last clever idea failed. Bring me evidence, not excitement — and use me to stress-test the shiny thing.",
          }, t.O.pct),
        },
      ],
    },
    {
      key: "feedback",
      heading: "How to give me feedback",
      entries: [
        {
          title: "Delivery",
          body: pick({
            hi: "Be direct with me — I will not take honest critique personally, and I'd rather hear it plainly than decode a cushion. What actually stings is finding out people were managing me instead of telling me.",
            mid: "Straightforward and private works best: tell me what happened, what the impact was, and what you'd want instead. I'll engage with the substance rather than defend.",
            lo: "Give it to me straight and skip the compliment sandwich — I can tell, and it costs you credibility with me. Disagreement is comfortable territory for me; just bring your reasoning.",
          }, t.A.pct),
        },
        {
          title: "What I'll do with it",
          body: pick({
            hi: "I metabolize feedback quickly and without much wobble — if I go quiet afterward, I'm implementing, not sulking. Follow up in a week and you'll see what changed.",
            mid: "I take feedback seriously and may need a beat to separate the signal from the sting. If my first reaction seems defensive, give me a day — my second response is the real one.",
            lo: "Honest feedback lands hard on me even when I agree with it — that's wiring, not fragility, and it doesn't mean stop. Deliver it kindly, once, without piling on, and know that I will act on it even if my face says otherwise.",
          }, t.ES.pct),
        },
      ],
    },
    {
      key: "conflict",
      heading: "When we disagree",
      entries: [
        {
          title: "My pattern",
          body: pick({
            hi: "I stay level in conflict — heat doesn't escalate me, and I can usually hold the thread of the actual disagreement while emotions run. Use me as the de-escalation point when a discussion gets hot.",
            mid: "I argue cleanly when the disagreement is about the work, and I need a short reset when it turns personal. Naming the tension early works far better with me than letting it build.",
            lo: "Conflict spikes me fast and visibly — my first reaction will be bigger than my considered position. Don't negotiate with my first reaction: give me an hour, and you'll get the version of me that solves the problem.",
          }, t.ES.pct),
        },
      ],
    },
    {
      key: "energy",
      heading: "What energizes and drains me",
      entries: [
        {
          title: "People and focus",
          body: pick({
            hi: "Interaction charges me: back-to-back collaboration is a good day, and isolation is the thing that actually tires me. If I've gone quiet for days, check on me — that's not my natural state.",
            mid: "I run on a rhythm of people and quiet: collaborative bursts, then focused recovery. Protect at least part of my calendar from meetings and you'll get my best output in both modes.",
            lo: "Focus charges me and meetings spend me — I do my best work in long uninterrupted stretches. Default to async with me, batch the meetings, and never read my preference for quiet as disengagement.",
          }, t.E.pct),
        },
      ],
    },
    {
      key: "reliability",
      heading: "What you can count on",
      entries: [
        {
          title: "My word",
          body: pick({
            hi: "If I committed to it, it's handled — I track my promises without reminders, and I'll flag slippage before you notice it. The favor to return: be as explicit with me about your commitments as I am about mine.",
            mid: "I'm reliable on the commitments we've made explicit and looser on things left vague — so let's make the important ones explicit. A written 'who does what by when' is never bureaucracy to me.",
            lo: "My intentions are better than my tracking: if it isn't written down, it can genuinely slip my mind. Help me help you — put requests in writing, remind me without apology, and know that the structure is for my memory, not my motivation.",
          }, t.C.pct),
        },
      ],
    },
  ];
  if (values) sections.push({ key: "values", heading: "What I value", entries: valueWorkEntries(values) });
  return sections;
}
