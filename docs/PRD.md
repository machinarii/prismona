# PRD — "Keystone" (working title)
### A research-grade personality & compatibility platform

**Version:** 0.2 · **Date:** 2026-06-11 (orig. 2026-06-10) · **Owner:** Jin
**Companion docs:** `research/BIBLIOGRAPHY.md` (evidence base) · `ROADMAP.md` (feature status) · `poc/index.html` (original proof of concept)
**Shipped as:** Prismona (https://prismona.vercel.app) — Next.js app at the repo root; "Keystone" was the working title.

---

## 1. Vision

A personality assessment people take as seriously as a credit score and enjoy as much as 16Personalities — built only on instruments and findings that survive peer review. One profile, many decisions: *Should we date? Should we cofound? Is this hire right for this role? Can I trust this person with X?*

**Positioning in one line:** The compatibility layer for high-stakes human relationships, with the scientific honesty MBTI never had.

## 2. Problem

- The most popular tests (MBTI, Enneagram) have weak retest reliability and poor predictive validity, yet dominate because of superior UX and shareable identity ("INTJ") [Pittenger 2005; McCrae & Costa 1989].
- The scientifically defensible options (Hogan, NEO-PI-R, CliftonStrengths) are enterprise-priced, consultant-gated, or stop at the individual — none of them answer *"are WE compatible, for THIS purpose?"*
- Specific unmet jobs-to-be-done: cofounder due diligence (≈65% of startups fail substantially due to cofounder conflict — Wasserman 2012; founder personality mix predicts up to ~10× success odds — McCarthy et al. 2023, *Sci Reports*), role-fit in hiring, and relationship compatibility grounded in actor/partner effects rather than astrology-grade matching.

## 3. Scientific foundation (what we build on, and what we claim)

| Layer | Framework | Instrument | Why |
|---|---|---|---|
| Core traits | Big Five / Five-Factor Model | IPIP-NEO-120 (full), Mini-IPIP (quick) — public domain | Best-replicated model in psychology; predicts work, relationship, health outcomes (Roberts 2007; Soto 2019) |
| Integrity/trust | HEXACO Honesty-Humility | IPIP-HEXACO scales — public domain | Strongest known predictor of workplace deviance (ρ ≈ −.48, Pletzer 2019) and unethical behavior |
| Values (v2) | Schwartz refined values theory | PVQ-RR (license from author) | Validated in 49 cultures; value congruence → trust & attraction (Edwards & Cable 2009) |
| Attachment (v2, romance) | Adult attachment dimensions | ECR-R | IRT-validated anxiety/avoidance dimensions (Fraley 2000) |
| Archetypes | Empirical trait clusters | Derived from trait scores | Gerlach et al. 2018 (*Nat Hum Behav*) found four robust density clusters; we present archetypes as a narrative layer over dimensional scores, never instead of them |
| Quality control | Response latency + attention checks | Per-question timer | Latency discriminates honest vs. faked responding (Holden 1995; Fine & Pirak 2016); also keeps pace and reduces over-deliberation |

**Claims discipline (non-negotiable):** We report effect sizes honestly. Personality explains a meaningful minority of variance in outcomes (r ≈ .2–.3 for the best predictors). We never claim to "predict" relationship success — Joel et al. 2020 (PNAS, 43 studies) shows relationship-specific perceptions outpredict individual traits. We sell *insight and structured conversation*, not fortune-telling. Every result screen links its evidence.

**Why per-question timing:** (a) first-instinct responses reduce impression management; (b) latency profiles flag careless/faked protocols (Meade & Craig 2012; Fine & Pirak 2016); (c) it creates a distinctive, game-like pacing competitors lack. We use generous limits (20s) — timing is a quality signal, not a stressor.

## 4. Users & jobs-to-be-done

1. **Self-knowledge seeker (entry funnel, free).** "Tell me how I think, decide, and what I value." → Archetype + full dimensional profile.
2. **Couple / prospective partner (B2C paid).** "Where will we clash, and is it workable?" → Dyad report: actor/partner risk factors (esp. emotional stability, agreeableness, conscientiousness — Malouff 2010), conversation scripts.
3. **Cofounder pair/team (B2B-lite paid, highest willingness-to-pay).** "Should we build a company together?" → Team composition report: trait diversity score, H-factor trust screen, role-division suggestions, conflict-mode forecast (McCarthy 2023; Bell 2007).
4. **Hiring manager (B2B, v2 — compliance-gated).** "Is this candidate a fit for this *role*?" → Job-analysis-driven fit report (Kristof-Brown 2005; trait activation, Tett & Burnett 2003). Requires EEOC/AERA-APA-NCME-compliant validation before launch.

## 5. Competitive landscape

| Competitor | Science basis | Compatibility? | Price | Weakness we exploit |
|---|---|---|---|---|
| **16Personalities** (NERIS) | MBTI-flavored + trait scales; not peer-validated | No dyads | Free; Teams $9/user/mo | Type labels without validity; no two-person product |
| **Gallup CliftonStrengths** | Proprietary; modest published validity | No | $49.99–$59.99 | Individual-only, corporate tone, no trust/values layer |
| **Official MBTI** (Myers-Briggs Co.) | Poor retest reliability, bimodality unsupported | No | $49.95 | Scientifically weakest; we are the explicit antithesis |
| **Hogan Assessments** | Strong I/O validity incl. dark side (HDS) | Team reports via consultants | $$$, certification-gated | Inaccessible to consumers/founders |
| **Truity** | Mixed (Big Five + MBTI-style) | Limited | Free–$29; hiring from $66 | Test catalog, not a compatibility engine |
| **Crystal Knows** | DISC + AI inference | Sales-communication oriented | SaaS | Inferred profiles ≠ assessed; weak science |
| **PrinciplesYou / PrinciplesUs** (Dalio + Golden, Zackrison) | Credible (built with psychologists) | Pair comparisons | Free / enterprise | Low momentum; no romance/cofounder verticals |
| **Boo** | MBTI 16-types + Big Five hybrid | Dating matching | Freemium app | Dating-only; type-first science |
| **Dimensional** | Big Five + attachment + values | Friend/partner compatibility | Freemium iOS | Closest analog — but consumer-social only; no cofounder/hiring, no timing/QC layer, weak on claims discipline |
| **Predictive Index / Plum / TestGorilla** | I/O-grade selection science | Team analytics | Enterprise SaaS | Hiring-only, no consumer funnel |

**White space:** nobody serves *cofounder diligence* seriously; nobody spans consumer → professional with one validated profile; nobody makes scientific honesty (effect sizes, citations, uncertainty) a brand feature. Sources: [16Personalities pricing](https://www.16personalities.com), [CliftonStrengths pricing](https://blog.traitlab.com/work-personality-test-platform-comparison), [Truity comparison](https://soultrace.app/en/blog/truity-vs-16personalities), [Boo algorithm](https://boo.world/resources/our-algorithm), [market overview](https://traitstack.com/blog/the-9-best-personality-tests-in-2026-honestly-ranked/).

## 6. Product scope

### 6.1 MVP — ✅ built and live (exceeds original scope)
- **Test:** two tiers — Quick: 26 items (Mini-IPIP + 6 IPIP Honesty-Humility, ~5 min); Full Index: 126 items (IPIP-NEO-120 + H, 30 facets). 5-point Likert.
- **Per-question timer:** 20s visible countdown; auto-advance on timeout (item marked unanswered); latency recorded per item.
- **Quality flags:** % too-fast responses (<800ms), timeouts, straight-lining, person-fit consistency index; shown on results as a confidence indicator.
- **Scoring:** reverse-keyed means → z-scores vs. published norms → percentiles with ±1 SEM bands. Client-side only; no account, no server (privacy by default).
- **Archetype:** nearest-prototype match over 6 trait z-scores to 8 research-anchored archetypes; always shown WITH the dimensional profile and a "you are 73% Architect, 41% Catalyst" gradient, per the Gerlach/Freudenstein debate.
- **Distillation:** per archetype — how you think, act, decide/solve, what you value, blind spots, trust profile (H-factor).
- **Applied readings (added v0.2):** the static per-archetype compatibility notes were replaced by dynamic readings generated from the user's actual percentiles (three tiers: ≥70 / ≥40 / <40), facet-refined on the full tier, across six use cases — relationships, career, work style, leadership & teams, integrity, cofounder fit. Every reading cites its evidence inline and carries an epistemic caveat; the integrity reading explicitly disclaims any screening/hiring use.
- **Dyad reports (pulled forward from v1):** share-code compare for romantic / cofounder / colleague — see §7.
- **Still out of scope:** accounts, payments, hiring module.

### 6.2 v1 (months 2–5)
Accounts + profile persistence; invite flow on top of the existing share-code dyad compare; shareable archetype cards (growth engine); norms recomputed from own user base. (IPIP-NEO-120 facet tier and dyad reports already shipped in MVP — see §6.1.)

### 6.3 v2 (months 6–12)
Schwartz PVQ-RR values module + value-congruence scoring; ECR-R attachment module (romance vertical); cofounder team report (3+ people, diversity index); hiring/role-fit module **only after** criterion validation study + legal review (EEOC adverse-impact analysis, AERA/APA/NCME Standards).

## 7. Compatibility engine (design notes)

- **Dyad scoring is asymmetric and purpose-specific.** Romance: partner's emotional stability/agreeableness/conscientiousness → your satisfaction (actor+partner effects, Malouff 2010; Dyrenforth 2010). Similarity per se adds little — we say so.
- **Cofounders:** reward *complementary* trait spreads (McCarthy 2023; Bell 2007), flag dual-low-conscientiousness and any low-H pairing (trust risk), forecast conflict styles from A × N interaction.
- **Role fit:** trait-activation mapping from job-analysis questionnaire → required trait profile → candidate distance score (Tett & Burnett 2003; Kristof-Brown 2005).
- Output is always: score + top 3 friction forecasts + structured conversation prompts. Never a binary verdict.

## 8. UX principles
Calm, editorial, premium ("research institute, not BuzzFeed"). One question per screen, keyboard-first, visible timer ring. Results readable in 90 seconds, expandable to full depth with citations. Radical transparency: every claim links a paper.

## 9. Privacy, ethics, compliance
- Personality data is sensitive: local-first in MVP; explicit consent + deletion rights (GDPR/CCPA) when accounts arrive.
- No selling of profiles, ever. No covert assessment of third parties.
- Hiring module gated behind professional validation; publish adverse-impact analyses.
- Prominent uncertainty communication: percentile bands, not point identities.

## 10. Business model (hypothesis)
Free core test → paid full report ($19–29) → dyad reports ($39/pair; cofounder $99 incl. facilitation guide) → team/org SaaS. Wedge: cofounder diligence via accelerators/VC platform teams (high WTP, low compliance burden vs. hiring).

## 11. Success metrics
- MVP: completion rate >85%; median time <6 min; quality-flag rate <10%; share rate of archetype card >15%.
- Science: retest r > .80 (2-week, instrument benchmark); archetype stability >75%; published norms n >10k within 6 months.
- Business: free→paid 3–5%; dyad invite acceptance >40%.

## 12. Risks
| Risk | Mitigation |
|---|---|
| "It's just another quiz" | Citation-forward UX; effect-size honesty as differentiation |
| Archetypes overclaim (typing fallacy) | Always paired with dimensional profile + gradient membership |
| Hiring use → legal exposure | Module gated; Standards-compliant validation first |
| Short test = noisy scores | Mini-IPIP is a screening tier; upsell IPIP-NEO-120 for decisions |
| Faking in evaluative contexts | Latency flags + context norms; never sole basis for decisions |

## 13. Use-case expansion & feature roadmap
See `ROADMAP.md` for the full prioritized feature list (facet reporting, uncertainty bands, person-fit QC, informant 360, dyad engine, team indices, norms/outcome moats) and twelve new verticals (therapist tooling, VC diligence, "working with me" manuals, roommate matching, portable personality API, etc.). Lead sequence: B2B2C professional tools sharing the dyad engine.

## 14. Open questions
1. License PVQ-RR and ECR-R commercial terms (IPIP needs none).
2. Recruit psychometrician advisor for norms + validation study design.
3. Brand/name; "Keystone" placeholder.
4. Dyad report pricing tests; B2C romance vs. B2B-lite cofounder lead vertical.
