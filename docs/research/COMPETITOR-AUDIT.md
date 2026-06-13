# Prismona — Competitor Audit

_Last updated: 2026-06-13_

Prismona's positioning: a **research-grade Big Five "blueprint"** that is **portable to AI agents (via MCP)**, **continuously tuned** (agent observations re-shape the observed layer), and **shareable** for team / relationship fit — built **privacy-first** (local storage, HMAC-keyed server data, share codes that carry their own z-scores).

Competitors are grouped by how directly they overlap with that full intersection, not by raw traffic.

---

## Tier 1 — Closest direct competitors (personality → AI agents)

The real battleground. Small but heating up.

- **Crystal Knows** — _the single closest competitor._ Ships a **"Personality AI (Skills, Agents, MCP)"** product that connects your personality profile + coworker insights directly into AI tools so responses match how you work; plus shareable profiles and "how to work with them" output. Differences: **DISC-based, not Big Five**; B2B sales / recruiting–centric; infers personalities from public data rather than centering a rigorous self-report instrument. **Study hardest.**
- **OpenClueo / ClueoMCP** — MCP server with a "Big Five personality engine" across Claude/Cursor/Windsurf/VS Code. Points the _other way_: gives the **AI** a consistent personality, not the AI a model of **you**. Adjacent, not the same.
- **AI memory / context layers** (Mem0, Plurality.network) — portable "personal context" that follows you across ChatGPT/Claude. Carry preferences and history, not a **measured** personality. Infrastructure-level, no psychometric instrument.

**Moat here:** research-grade Big Five (not DISC, not inference) + continuous-tuning loop + privacy-by-architecture. Nobody combines all three.

## Tier 2 — Research-grade Big Five instruments (measurement peers)

Compete on _scientific credibility_ — the "honesty science demands" angle.

- **Understand Myself** (Jordan Peterson) — most rigorous commercial Big Five; aspect-level scoring + percentiles. Closest on instrument quality; **zero AI/portability story.** Credibility benchmark.
- **Truity** — broadest single platform (Big Five, MBTI/TypeFinder, Enneagram, DISC, Career, Love Styles); polished, paywalled full reports; strong SEO/brand. See "Truity lineup vs. Prismona" below.
- **IPIP-NEO platforms** — the public-domain 120-item engine Prismona resembles: **IDRlabs**, **PsychKit (IPIP-NEO-120)**, **BigFive-Test.com**, **PersonalityTest.net**, **See My Personality**. Free, bare-bones, no sharing/AI layer.
- **Soultrace** — adaptive Big Five via Bayesian active learning (ex-Meta/Google/HF). "Smart instrument" competitor.

## Tier 3 — Mass-market consumer personality

Big traffic, low rigor — own mindshare, not science.

- **16Personalities** — ~18–19M monthly visitors, MBTI-style; gravitational center of the category.
- **IDRlabs** — 200+ free tests.

## Tier 4 — Team / workplace assessment + delivery

Competes on the "team chemistry / working-with-me" surface.

- **Cloverleaf** — closest in _delivery model_: imports assessments (DISC, Enneagram, CliftonStrengths, MBTI) and drips coaching tips into Slack/Teams/calendar. "Continuous, in-your-workflow" angle rhymes with Prismona's continuous-tuning vision — but no AI-agent context layer.
- **CliftonStrengths (Gallup)**, **Predictive Index**, **Everything DiSC**, **Hogan**, **Plum**, **Pymetrics** — enterprise hiring/L&D incumbents. Heavy, certified, expensive; not portable or AI-native.

## Tier 5 — The "user manual for me" format

Prismona effectively _automates_ this category with measurement.

- **Atlassian Team Playbook "My User Manual,"** Slack Personal Operating Manuals, Asana templates — free, manual, unvalidated hand-written docs. Prismona's blueprint is the measured, auto-generated, AI-readable version.

---

## Where Prismona sits

No competitor occupies the full intersection.

| Capability | Crystal | Understand Myself | Cloverleaf | 16P | **Prismona** |
|---|---|---|---|---|---|
| Research-grade Big Five | ✗ (DISC) | ✓ | partial | ✗ | ✓ |
| Portable to AI agents (MCP) | ✓ | ✗ | ✗ | ✗ | ✓ |
| Continuous tuning from agents | ✗ | ✗ | partial (tips) | ✗ | ✓ |
| Shareable blueprint / team fit | ✓ | ✗ | ✓ | partial | ✓ |
| Privacy-by-architecture | ✗ | ✗ | ✗ | ✗ | ✓ |

- **Crystal Knows** = most dangerous competitor (same AI-context thesis, more funding, weaker science).
- **Understand Myself** = credibility benchmark (better instrument, no AI story).
- **Defensible wedge:** the line between them — _rigorous measurement made portable and continuously tuned for the AI agents you actually work with._

---

## Truity lineup vs. Prismona (coverage map)

Truity's product set, and how Prismona relates to each:

| Truity product | Framework | Prismona coverage |
|---|---|---|
| TypeFinder (16 types / Myers-Briggs) | MBTI-style types | _Not measured._ Prismona is Big Five; it can _derive_ an archetype, but does not output 4-letter types. |
| TypeFinder for the Workplace | MBTI + work context | Partial — Prismona's "working with me" / team-chemistry surface serves the same job, Big-Five-based. |
| Enneagram for the Workplace | Enneagram (9 types) | _Not measured._ Different model. |
| DISC Personality Assessment | DISC (behavioral) | _Not measured._ Crystal's territory, not Prismona's. |
| Big Five Personality Test | Big Five (OCEAN) | **Core.** Prismona's instrument is here and more rigorous (facet detail, percentiles, confidence). |
| Career Aptitude / Career Personality Profiler | RIASEC / interests | Partial — Prismona surfaces an interest/career read in the blueprint, not a full Holland-code aptitude test. |
| 7 Love Styles Test | Relationship styles | _Not measured._ Prismona's compatibility/compare is trait-fit, not a love-styles typology. |

**Takeaway:** Truity competes on _breadth_ (many frameworks, one site). Prismona deliberately competes on _depth + portability_ in one framework (Big Five) plus the AI/continuous-tuning layer Truity entirely lacks. Adding MBTI/Enneagram/DISC/Love-Styles modules would chase Truity's breadth game and dilute the wedge — only worth it if a specific framework is the on-ramp a target segment expects.

---

## Framework expansion strategy — which (if any) to add

**Evaluation lens** (a good addition hits 1+2, not just 3):
1. **Preserves credibility** — research-grade, or it erodes "the honesty science demands."
2. **Gives an AI agent _new_ actionable signal** — orthogonal to Big Five, not redundant.
3. **Is the expected on-ramp for a _specific_ segment.**

Frameworks hitting 1+2 _deepen_ the wedge; ones hitting only 3 _chase breadth_ (Truity's game) and dilute.

### Ranked recommendations

**#1 — HEXACO (add the 6th factor: Honesty-Humility). Do regardless of segment.**
Barely a new "module" — an _upgrade to the core instrument_. HEXACO = Big Five + **Honesty-Humility** (sincerity, fairness, non-exploitation, modesty); the academically-respected successor to the Five-Factor Model.
- **Brand alignment is perfect** — the tagline is about _honesty_; Prismona becomes the test that measures it. "Six factors, because the science moved past five."
- **New, agent-actionable signal** — predicts trustworthiness, delegation safety, integrity in ways Big Five Agreeableness does not. Exactly what an AI agent (or teammate) should know.
- **Zero dilution** — still hard-science self-report; makes Prismona _more_ rigorous than Understand Myself (five-factor), not less.

**#2 — Values module (Schwartz Basic Values / PVQ-RR). Best complement.**
Traits = _how_ you behave; values = _what_ you're trying to achieve. For AI portability, **values are the single most useful thing to hand an agent** ("optimize for autonomy/achievement, avoid trampling security/tradition"). Cross-culturally validated (10 values, 4 higher-order), orthogonal to Big Five, directly powers the "working with my AI" surface.

**#3 — One segment on-ramp, by the market actually being attacked:**
- **B2B teams / sales → DISC.** Low science, but the lingua franca of corporate L&D and Crystal's turf. Only if selling into orgs that already speak DISC.
- **Relationships / dating → Attachment styles (ECR-R).** Research-grade (unlike Love Styles), massive consumer pull; strengthens compare/compatibility. The pick if relationships become a wedge.
- **Consumer top-of-funnel / SEO → MBTI as a _derived translation_, never the instrument.** Derive a 16-type label from Big Five scores (well-established mapping) to capture "what's my type" search volume without adopting the pseudoscience.

### Considered, would not lead with
- **Motivation/drives (Reiss, F4S meta-programs)** — agent-actionable but overlaps Values; pick Values first.
- **Regulatory Focus (promotion/prevention)** — already in the DNA (Higgins is cited); better as a trait-derived _insight_ than a standalone test.
- **Enneagram** — highest dilution-to-value ratio of anything popular. Hard pass for a credibility brand.
- **Dark Triad / Tetrad** — real science but reputationally toxic for a _trust_ product; at most a hidden "shadow" footnote.
- **CliftonStrengths / VIA strengths** — strengths reframing of trait data; nice-to-have, not differentiating.
- **Moral Foundations (Haidt)** — politically charged; avoid.
- **Hogan (HPI/HDS/MVPI)** — exec-assessment gold standard, but a whole enterprise product, not a module.

### Bottom line
Add **HEXACO's Honesty-Humility to the core** (credibility _and_ brand win), add a **Schwartz Values module** as the agent-facing complement, and add **exactly one on-ramp** only when committing to a segment. Everything else is breadth-chasing.

---

## Sources

- [Crystal — Personality AI (Skills, Agents, MCP)](https://www.crystalknows.com/personality-ai) · [Best Personality Tests 2026](https://www.crystalknows.com/best-personality-test) · [AI that understands people](https://www.crystalknows.com/resource/ai-that-understands-people) · [Best employee personality tests 2026](https://www.crystalknows.com/best-employee-personality-tests)
- [OpenClueo MCP Server](https://glama.ai/mcp/servers/@ClueoFoundation/ClueoMCP)
- [Plurality.network — switch ChatGPT↔Claude without losing context](https://plurality.network/blogs/switch-from-chatgpt-to-claude/) · [Best AI agent memory frameworks 2026 (Mem0)](https://machinelearningmastery.com/the-6-best-ai-agent-memory-frameworks-you-should-try-in-2026/)
- [Truity review 2026](https://soultrace.app/en/blog/truity-personality-test) · [Definitive personality test guide 2026](https://soultrace.app/en/blog/best-personality-test)
- [IPIP-NEO-120 (PsychKit)](https://psychkit.org/ipip-neo-120/) · [IPIP-NEO-120 (PersonalityTest.net)](https://www.personalitytest.net/ipip/ipipneo120.html) · [Big Five IPIP-NEO-30 (IDRlabs)](https://www.idrlabs.com/big-five-ipip-neo-30/test.php)
- [Cloverleaf assessments](https://cloverleaf.me/assessments/)
- [Atlassian — My User Manual](https://www.atlassian.com/team-playbook/plays/my-user-manual) · [Slack — Personal Operating Manuals](https://slack.com/blog/collaboration/how-personal-operating-manuals-can-help-you-build-a-stronger-team-at-work)
