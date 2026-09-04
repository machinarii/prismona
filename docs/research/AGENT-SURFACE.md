# Prismona — Agent Surface (prose texture) research note

_Last updated: 2026-09-03_

Why a well-calibrated Prismona persona can still read like a bot, what the `humanizer` skill and its source list get right, why importing them wholesale would be the wrong move, and the **design position**: a small fixed block of genuine machine tells in `agentPersona()`, plus *measured* surface directives derived from the CSI communication-style bands.

---

## 1. The gap

Prismona's agent stack answers **who to be** and **in what register**:

| Layer | Where | Answers |
|---|---|---|
| complement calibration | `lib/persona.ts` `agentPersona()` | who to be, relative to this person's traits |
| flavor (6) / role (11) | `PERSONA_FLAVORS`, `PERSONA_ROLES` | which register and craft to foreground |
| comportment | `lib/comportment.ts` | formality/deference/disclosure for a relationship + stakes |
| values / delegation / communication briefs | `lib/values.ts`, `lib/delegation.ts`, `lib/commstyle.ts` | what they care about, how they want agents run, how they talk |

Nothing in that stack governs **how the prose reads on the page**. `commBrief` says so explicitly: *"These describe register, not substance."*

The practical consequence: a perfectly calibrated complement persona can still open with "Great question!", stack em-dashes, bold every third phrase, hedge every claim into mush, and close with "I hope this helps!" — and it will feel like a bot regardless of how well the calibration was done. Surface texture is a separate axis from calibration, and Prismona currently says nothing about it.

## 2. Prior art: `humanizer` and its source

[`blader/humanizer`](https://github.com/blader/humanizer) (MIT, 41.7k★) is an agent skill that rewrites AI-generated text to read as human-written while preserving factual claims. Its mechanism is a **post-hoc two-pass loop**: analyse input (and a writer voice sample if given) → draft a rewrite without treating the original structure as fixed → critique the draft against 35 named patterns → revise → verify with two questions ("what still sounds generated?", "did facts change?").

The 35 patterns are drawn from Wikipedia's [**WikiProject AI Cleanup — Signs of AI writing**](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing), which is the primary, community-maintained, continuously-updated source and the more appropriate thing to cite. They group roughly as: content inflation and vague sourcing (1–6), language and grammar tics (7–19), chatbot-specific artifacts (20–22), and filler/hedging/structure habits (23–35).

The skill is careful about false positives — polish alone is not evidence of generation, formal vocabulary is not a tell, and genuine alternatives should survive a rewrite.

## 3. Why not import it

**It has nowhere to run.** Prismona does not execute the agent. It emits a system prompt that *someone else's* agent consumes, over MCP (`agent_persona`) or a pasted context block (`lib/portable.ts`). A critique-and-revise loop over produced output has no host inside Prismona's architecture. Only the *content* of the 35 could transfer — as prescriptive directives — and that transfer is lossy.

**Negative checklists are poor system-prompt material.** Thirty-five "don't" rules is long, largely self-defeating as instruction, and would roughly double a persona block that already runs ~600 words once flavor, role, comportment and three briefs are folded in. Token cost lands on every agent that adopts the persona.

**It is anti-differentiating.** Prismona's claim is *personalization derived from measurement*. A fixed, generic 35-rule list is the opposite: freely available to anyone, identical for every user. Shipping it as part of the profile makes the profile less distinctive.

**Most of the 35 are taste, not bot-ness.** "Remove em-dashes" is a style opinion — many strong human writers use them, and the skill's own false-positives section concedes the point. Bold, triplets, list formatting, and vocabulary preferences vary by reader. Prismona already **measures** this dimension and should not hardcode one person's taste as universal law.

## 4. The line worth drawing

Split the 35 along a boundary `humanizer` does not draw:

**Universal machine tells** — artifacts of the generating process that essentially no reader wants, independent of profile or context. Roughly ten of the 35: chatbot closings ("I hope this helps", "let me know if…"); agreeable preamble before answering ("Great question!"); knowledge-limit disclaimers and speculative gap-filling; fake-candid openings ("Honestly?", "Look"); answering objections nobody raised; rejecting alternatives never mentioned again; announcing a point instead of making it; generic positive endings in place of concrete facts; vague sourcing ("experts argue"). These are defensible as a small fixed block.

**Style preferences** — the remaining ~25. Sentence rhythm, verbosity, hedging density, formatting, vocabulary register, framing. These belong to the **measured** layer: `lib/commstyle.ts` already scores six CSI dimensions (de Vries et al.) that map onto them closely.

| CSI dimension | governs which surface habits |
|---|---|
| Expressiveness | verbosity, filler, padding, performed enthusiasm |
| Preciseness | vagueness, hedging density, structural discipline |
| Directness | cushioning, agreeable preamble, softened conclusions |
| Questioningness | whether to surface objections and counter-arguments |
| Emotional expression | how much affect belongs in the prose |
| Impression management | sales language, inflated importance, framing |

This is a small extension rather than a new idea: `DIM_TEXT` already carries outbound surface guidance for some bands (low expressiveness reads *"don't pad your replies — every extra paragraph costs me"*). The work is to make that systematic across all six dimensions and three bands.

## 5. Conflict with Prismona's science posture — must be resolved explicitly

Pattern 24 ("excessive qualifiers undermining claims") collides head-on with Prismona's epistemic discipline. The product *requires* calibrated hedging: SEM bands on every score, "modest effect sizes" stated plainly, no verdicts, `agentPersona`'s own boundaries paragraph instructing the agent to treat traits as probabilistic tendencies.

**Resolution:** hedge about the *evidence*, never about the *recommendation*. "r ≈ .25, so treat this as a nudge, not a rule" stays — that is honest calibration. "I think maybe you might want to consider possibly…" goes — that is hedged delivery of an unhedged opinion. Any surface block must state this rule outright, or it will fight the `Boundaries:` paragraph already in the persona prompt.

## 6. Framing constraint

`humanizer` is positioned in part around evading AI-writing detection. Prismona's PRD refuses deceptive uses throughout (no screening, no verdicts, no surveillance psychographics). "Don't sound like a bot" is legitimate UX; "pass as human-written" is a different and unwanted claim.

Prismona's surface layer is therefore framed as **removing artifacts of the generating process that degrade communication** — never as helping output evade detection or misrepresent its origin. No feature, tool description, or doc should describe it as making AI text pass as human.

## 7. Design position

_Built 2026-09-04 as `lib/agentsurface.ts` (`SURFACE_TELLS`, `DIM_SURFACE`, `surfaceDirectives()`), folded into `agentPersona()` via a new `comm?: CommStyleProfile` option and wired to `agent_persona`'s existing `commCode`. `commBrief` was left untouched — it is first-person inbound ("how to read my messages"); `surfaceDirectives()` is its second-person outbound sibling off the same profile._

- **A small fixed block** of universal machine tells in `agentPersona()`, cited to WikiProject AI Cleanup, carrying the §5 hedging rule explicitly.
- **Measured surface directives** from the CSI bands, extending `commBrief` — the personalized half, and the half only Prismona can ship.
- **No rewrite loop, no 35-item checklist, no vendored fork.**
- Surface directives are subordinate to calibration: where they conflict with the complement directives or comportment, calibration wins, consistent with the existing precedence language in `agentPersona()`.

## 8. Where this sits in the AI-collaboration layer

Three axes have now been examined, and they compose:

| axis | source | stability | status |
|---|---|---|---|
| **trait** | measured instruments (Big Five + H, values, delegation, CSI) | stable | shipped |
| **state** | transient signal (e.g. voice arousal) | per-session | researched, not built — `VOICE-STATE.md` |
| **surface** | prose texture | per-message | this note |

*trait × state × surface → delivery.* This is likely the organizing frame for ROADMAP §F rather than three unrelated additions.

---

### Sources

[blader/humanizer](https://github.com/blader/humanizer) (MIT) · [Wikipedia: WikiProject AI Cleanup — Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) (CC BY-SA) · de Vries et al., Communication Styles Inventory — see `BIBLIOGRAPHY.md` · related: `VOICE-STATE.md`, `../ROADMAP.md` §F
