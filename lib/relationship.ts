import type { Profile } from "./types";
import type { ManualSection } from "./manual";
import { valueLoveEntries, type ValuesProfile } from "./values";

// "Relationship with me": a concise, partner-facing one-pager for a romantic
// context, generated from trait percentiles. Same three-tier keying as the
// working-with-me manual (≥70 high, ≥40 mid, <40 low). The best-replicated
// finding in couples research is that a partner's emotional stability,
// agreeableness and conscientiousness predict the other's satisfaction
// (Malouff 2010; Dyrenforth 2010), so the report leads with those.

interface Tiered { hi: string; mid: string; lo: string }
const pick = (t: Tiered, pct: number) => (pct >= 70 ? t.hi : pct >= 40 ? t.mid : t.lo);

export function buildRelationship(p: Profile, values?: ValuesProfile | null): ManualSection[] {
  const t = p.traits;
  const sections: ManualSection[] = [
    {
      key: "closeness",
      heading: "How I show love",
      entries: [
        {
          title: "Affection style",
          body: pick({
            hi: "I run warm and expressive — I'll reach for you, say it out loud, and want to share the small things as they happen. Closeness recharges me, so distance reads to me as a problem long before it is one. Tell me when you need space; I won't assume it.",
            mid: "I show love in a mix of words and presence, dialed to the day. I can be effusive and I can be quiet-close — neither is a verdict on us. If you tell me which one you need right now, I can give it deliberately.",
            lo: "I love steadily and undramatically — more through showing up than declaring it, and my quiet is contentment, not distance. The work I owe you is saying the thing out loud, because steadiness only reads as love when it's narrated.",
          }, t.E.pct),
        },
        {
          title: "Everyday warmth",
          body: pick({
            hi: "Daily life with me is low-friction by temperament: I extend goodwill first and would rather accommodate than win. The shadow side is conflict debt — what I don't raise compounds — so pull the hard conversations out of me before they ferment.",
            mid: "I give and I hold my ground in roughly even measure: I'll meet you most of the way and dig in where it matters. Tell me directly which is which and we'll waste less time guessing.",
            lo: "I lead with candor over accommodation, which makes me honest company and occasionally sharp company. Don't read my bluntness as coldness — but do tell me when the delivery lands harder than I mean, and I'll soften it.",
          }, t.A.pct),
        },
      ],
    },
    {
      key: "conflict",
      heading: "When we fight",
      entries: [
        {
          title: "My pattern under stress",
          body: pick({
            hi: "I stay level when things heat up — I de-escalate by default and can usually hold the actual thread of a disagreement while feelings run. My risk is the opposite one: reading your bigger emotions as a problem to fix rather than weather to share. Sometimes you need me beside you, not solving.",
            mid: "Most days I'm even; hard weeks wobble. What matters with me isn't never spiking, it's repair speed — how fast I come back and re-engage after a rough moment. Hold me to the return, not to perfection.",
            lo: "I feel things first and hardest, and my first reaction will be bigger than my settled position — that's wiring, not drama. Don't negotiate with my first reaction. Name the wave early with me (“this is the volatility, not us”), give it an hour, and you'll get the version of me that wants to solve it.",
          }, t.ES.pct),
        },
      ],
    },
    {
      key: "needs",
      heading: "What I need to feel close",
      entries: [
        {
          title: "Time and presence",
          body: pick({
            hi: "I need real interaction to feel connected — shared activity, talking things through, being in the same room. Long stretches of parallel-but-separate quietly starve me. If I've gone distant, that's the signal to come closer, not to give me room.",
            mid: "I need a rhythm of together and apart: closeness, then a little recovery, then closeness again. Protect both and I'm at my best; collapse either one and I feel it.",
            lo: "I need unhurried, low-stimulation closeness — fewer people, deeper, and a partner who doesn't read my quiet as a wall. Solitude restores me; let me have it without it becoming a referendum on us, and I come back fuller.",
          }, t.E.pct),
        },
        {
          title: "Novelty vs. familiarity",
          body: pick({
            hi: "I'm fed by newness — new places, ideas, ways of doing the same old things. A relationship that stops exploring feels, to me, like one that's stopped growing. Plan the occasional disruption with me and watch me light up.",
            mid: "I like a base of familiar comfort with regular doses of new. Keep the rituals and surprise me sometimes; I don't need constant novelty, but I notice when it's been a while.",
            lo: "I'm fed by the familiar — our rituals, our places, the deep grooves we wear together. Consistency is how I bond, not novelty. Don't mistake my love of routine for boredom; it's how I say this is home.",
          }, t.O.pct),
        },
      ],
    },
    {
      key: "reliability",
      heading: "What you can count on",
      entries: [
        {
          title: "My word and our logistics",
          body: pick({
            hi: "If I said I'd handle it, it's handled — I carry the logistics of a shared life without reminders, and that dependability is one of the most underrated predictors of a partner's satisfaction. Just say the words back to me sometimes; I do it as love, and it lands best when it's seen.",
            mid: "I'm reliable on what we've made explicit and looser on what's left vague — so let's make the load-bearing things explicit between us. A shared calendar is never bureaucracy to me; it's how I keep my promises.",
            lo: "My intentions toward you are better than my follow-through, and if it isn't written down it can honestly slip. That's memory, not caring. Remind me without apology, put the important asks where we both see them, and know the structure is for my forgetfulness, never my devotion.",
          }, t.C.pct),
        },
        {
          title: "Trust and fairness",
          body: pick({
            hi: "What I say to you matches what I do away from you — I'm sincere, fair, and uninterested in playing angles in a relationship. You can take my word at face value, and I'll expect to take yours the same way.",
            mid: "I aim to be straight with you and mostly am; where I hedge, it's usually to dodge a fight rather than to deceive. Call me on it plainly and I'll come clean — directness costs me less than you might fear.",
            lo: "I can be strategic, and in a relationship that's the trait to watch and name out loud. Hold me to transparency — shared visibility over private maneuvering — and I'll meet a standard set clearly far better than one left implied.",
          }, t.H.pct),
        },
      ],
    },
  ];
  if (values) sections.push({ key: "values", heading: "What I care about most", entries: valueLoveEntries(values) });
  return sections;
}
