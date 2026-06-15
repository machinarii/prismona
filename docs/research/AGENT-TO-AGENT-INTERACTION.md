# Agent-to-Agent Interaction — Research Note

_Last updated: 2026-06-13. Status: exploratory / pre-spec. Depends on Spec A (HEXACO facets + agent-interpretation) and Spec B (Schwartz Values)._

When a user's agent — calibrated to that user's Prismona blueprint — works alongside a coworker's agent calibrated to a *different* blueprint, how should the two agents communicate? Should they mimic human social protocols, or drop into a more efficient agent-native exchange? This note records the position and its product implications.

## Separate three layers

Most of the "should agents talk like humans?" confusion dissolves once these are pulled apart — they want different answers:

1. **Transport** — how bits move (MCP, Google A2A, JSON-RPC). Maximally machine-efficient. Never human-mimetic.
2. **Coordination / negotiation** — goals, constraints, commitments, trust, conflict. The interesting layer.
3. **Human-boundary rendering** — when a result finally surfaces to a person.

## Position

**Agent-to-agent interaction should be agent-native. Modeling it on human social _style_ is a category error — with one exception.**

Much of human communication style solves problems agents don't have:
- Tone / hedging / politeness disambiguate cheaply and protect ego — agents can be explicit and have no ego to protect.
- Slow trust-building compensates for low bandwidth and no shared state — agents can exchange verifiable state directly.

So personality-matched "communication style" between two agents with **no human in the loop is cosplay** — pure overhead. The comms-adaptation layer (Spec A2) belongs **only at the human boundary**: when agent B's output is shown to human A, render it in A's style. In the middle, drop it.

**The exception** — human social machinery that encodes genuinely hard coordination problems that do _not_ vanish with efficiency:
- **Misaligned principals.** Two agents serve different masters with possibly conflicting interests. Game theory, not etiquette: trust calibration, commitment devices, conflict resolution stay necessary.
- **Accountability.** "You committed to X by Y" — agents need commitment logs as much as humans need social memory.

Keep those primitives in **function**; drop them in **form**.

## Two scenarios, mirror-image answers

Your agent, acting for you, meets the other side in one of two modes. The right amount of human-mimicry is set by a single rule: **it scales with how many humans are actually reading.**

### Scenario 1 — Agent ↔ coworker's agent (no human in the loop)
Both sides are machines representing absent (or busy) principals.
- **Communication style: drop it.** No human reads the exchange; channel/pace/tone-matching is pure overhead.
- **What flows instead:** structured negotiation profiles — risk posture, value priorities (B), H trust prior (A1), conflict mode, commitment preferences.
- **Output is the _coordination_**, plus a legible log each principal can later inspect.
- This is the `agent_handshake` surface (future Spec C).

### Scenario 2 — Agent ↔ human coworker (a human is reading)
Your agent represents you directly to a person — e.g. answering a teammate in Slack while you're heads-down or away.
- **Communication style: full force.** A human is on the other end, so the comms-adaptation layer (A2) applies completely — render in the coworker's preferred channel/pace/candor where known, sensible defaults otherwise.
- **Still a bounded proxy:** it represents _your_ values/integrity/risk posture (B, A1, O/C) and must disclose bounded authority — it is speaking _for_ you, not _as_ you.
- **Dual obligation:** faithful to you (what would Jin decide?) _and_ legible to them (rendered how this coworker best receives it). These are different jobs — represent vs. render — and the profile feeds both.

The proxy can operate in **either** mode within a single errand: negotiate machine-to-machine with the coworker's agent (Scenario 1), then render the agreed outcome to the human coworker (Scenario 2). Human style is applied _only_ at the human boundary.

## Relationship models — the backbone

Proxemics (closeness zones) is a useful instinct, but it supplies only one axis — *how guarded* a relationship is — not *what kind* it is. The principled approach layers two models:

1. **A distance / disclosure gradient** — proxemics (intimate → personal → social → public) or Dunbar's layers (5 / 15 / 50 / 150) — controlling **what is revealed**, formalized by **Social Penetration Theory** (Altman & Taylor: disclosure grows in breadth × depth as a relationship deepens). This is the share-code-scoping logic stated as theory: own agent = intimate (full blueprint); a stranger's agent = public (guarded).
2. **A relationship-type classifier** — **Fiske's Relational Models Theory** — controlling **the protocol / governance**. Fiske argues all human relationships reduce to four elementary forms:
   - **Communal Sharing** — shared identity, no scorekeeping → **user ↔ their own agent** (an extension of self).
   - **Authority Ranking** — asymmetric hierarchy → agent ↔ a boss (the managing-up surface).
   - **Equality Matching** — balanced reciprocity, turn-taking → **agent ↔ another's agent** (peers).
   - **Market Pricing** — ratios, contracts, cost/benefit → transactional exchange.

Supporting models that sharpen specific edges:
- **Principal–Agent theory** (economics) — the delegation mechanics: mandate, monitoring, incentive alignment, information asymmetry. Governs **user ↔ agent** and the bounded proxy (the Publish-gate and disclosed-authority moves are principal-agent).
- **Brown & Levinson politeness** — face-threat weight = **Social Distance + Power + Imposition**: a computable formality/hedging knob for **agent ↔ human**, pairing with the CAT comms layer.
- **Goffman dramaturgy** (front / back stage) — the proxy's impression management: candid **back-stage** with you, curated **front-stage** representing you. The vacation-proxy is pure Goffman.

### The three configurations, mapped

| Configuration | Type (Fiske) | Distance / disclosure | Governance |
|---|---|---|---|
| **User ↔ own agent** | Communal Sharing | intimate; full blueprint | Principal-agent, high trust, back-stage candor |
| **User's agent ↔ another human** | Authority Ranking *or* Equality Matching (boss vs peer) | social/public; Social-Penetration-scoped | Politeness = D+P+R; front-stage impression mgmt |
| **User's agent ↔ another's agent** | Equality Matching → Market Pricing | tie-strength-gated | A2A negotiation profiles + trust priors (`agent_handshake`) |
| **User's agent ↔ its own subagent** | Communal Sharing | intimate; full context shared | Same principal; Authority-Ranking task hierarchy; decomposition, not negotiation |
| **User's agent ↔ a multi-agent collective / org** | Market Pricing *or* Authority Ranking (context) | set to the collective (least-trusted member) | Group-level trust prior; designated interface + binding commitments + audit |

**The rule:** distance answers *how much* is shared; type answers *by what rules*. Proxemics alone conflates them — keep them as two dials. (This subsumes the earlier "human-mimicry scales with how many humans are reading" heuristic: **disclosure** scales with distance, **protocol** with type, and **human-style rendering** still applies only at a human boundary.)

## Persona vs. comportment

The agent is **one stable persona with adaptive comportment** — the same self carried differently depending on who is across the table. Two named layers, not "personality vs. not-personality":

- **Persona** — stable disposition, voice, values; tuned to complement the owner. **Does not change per counterparty.** Driven by the owner's blueprint.
- **Comportment** (sociolinguistic *register*; Goffman's *footing*) — how the agent carries itself: formality, deference, warmth, directness, disclosure, care. **Changes per counterparty**, driven by their status/power, the relationship type, and the stakes.

An assistant deferring more to a president than to a manager is **not a different personality — it is the same persona in a higher register.** That is the **status axis** of comportment (Brown & Levinson's *Power*; Fiske's *Authority Ranking* turned up): more power/stakes across the table → more deference, formality, care, hedging.

| Layer | What it is | Changes per counterparty? | Driven by |
|---|---|---|---|
| **Persona** | stable disposition, voice, values (complement to the owner) | **No** | the owner's blueprint |
| **Comportment** | formality, deference, warmth, directness, disclosure, care | **Yes** | counterparty status/power, relationship type, stakes |

What must never shift is the **persona**. Becoming a different entity to please a counterparty is the chameleon/manipulation failure — the low-Honesty-Humility pattern the instrument flags. Guardrail — **adapt comportment, never fake substance:** soften delivery, match formality, reveal less; never flip a recommendation to please, never hide that it is representing the owner, never modulate the honesty floor.

### `comportment_adapter` (future feature)

Given a counterparty (ideally their own code / `interaction_guide`) and the relationship, compute the **default comportment**:
- status/power + stakes → deference + formality (Brown–Levinson *P*; Fiske Authority Ranking)
- distance → disclosure (proxemics / Social Penetration)
- type → protocol (Fiske: Communal / Authority / Equality / Market)
- counterparty read → register convergence (CAT, via their `interaction_guide`)

These defaults are **not neutral** — they are positioned by who is across the table (e.g. *with a president*: high deference, high formality and care, guarded disclosure; *with a peer's agent*: terse, high disclosure of negotiation parameters).

**Owner modulation.** Expose each comportment dimension as a scrubbing bar (the Persona-Modulation slider UI), with one twist: the bar's **anchor is the computed default for that relationship**, not center — a tick marks the default so the owner sees how far they have nudged it. Dimensions: formality, deference, warmth, directness, disclosure, brevity. Saved **per relationship (or per relationship-type)**, layered on the fixed persona. The honesty floor is not a slider.

This keeps adaptation legible and owner-controlled: the framework sets a sensible comportment default for each relationship, the owner tunes it, and the **persona never moves**. It is the relationship-aware sibling of the global Persona Modulation on the AI tab.

## Two more interaction types: subagents and collectives

The 1:1 cases above don't cover two structurally different configurations.

### User's agent ↔ its own subagent (intra-principal)

The agent decomposes work to subagents that **serve the same owner**. This is **Communal Sharing**, not a relationship between parties: one mind split into tasks.
- **No negotiation, no trust prior.** Same principal → full trust, full context. The subagent **inherits** the owner's persona, values, and honesty floor — it is a role-specialization of the same self, not a separate entity.
- **Comportment overhead → near zero.** No human reading, same side: terse, structured, maximal disclosure between them. (This is Bridge's "agent delegates to a teammate," and the `peerAgent` register dialed all the way to internal.)
- **Authority Ranking on tasks only.** The parent directs and synthesizes; the hierarchy is about task flow, not status. The risk to manage is *drift* — a subagent silently diverging from the owner's calibration — so the parent re-grounds subagents from the same blueprint and owns the final synthesis.
- Contrast with `peerAgent` (different principals): that one *is* a negotiation with guarded disclosure and a trust prior; this one is not.

### User's agent ↔ a multi-agent collective / organization

The agent faces **many** agents operated by someone else — another person, an org, or a collective where several humans' agents are connected. This is **1:N**, and the group may have its own internal structure.
- **Disclosure is set to the collective, not the member.** Assume shared memory: *share to one agent = share to all*. Calibrate disclosure to the **least-trusted member** / the group as a whole, never to the friendliest interlocutor.
- **Trust is group-level.** Extend a trust prior to the **org/collective** (its reputation/credential), not to each agent. Honesty-Humility of *one* member doesn't vouch for the group.
- **Power asymmetry shifts comportment.** N agents out-capacity your one — and an org often out-ranks you (Authority Ranking). Expect more formality, guarded disclosure, and insistence on **explicit, binding commitments** rather than informal understandings.
- **Demand a designated interface + binding semantics + audit.** Know *who speaks for the collective* and whether their commitments bind the whole; keep a legible record. Without this, a collective can diffuse accountability ("no agent agreed to that").
- **Relational type is context-dependent:** Market Pricing with a vendor org, Authority Ranking with a high-status institution, Equality Matching with a peer collective — classify it first, then set comportment.

Both reuse the same machinery: persona fixed, comportment + disclosure set by the two dials. Subagents push *toward* intimate/communal (an internal extension); collectives push *toward* guarded/formal with group-level trust and hard commitments.

## What a personality blueprint becomes between agents

In agent-to-agent context a Prismona profile is **not a "how to talk to me" guide — it's a negotiation posture + a trust prior.** Two agents representing two humans need each other's:

- **Risk / decision posture** (reversible-experiments vs. lock-in-averse) — from C / O.
- **Value priorities** — **Spec B (Schwartz Values)**; the natural currency for agents negotiating on behalf of misaligned humans.
- **Trust prior** — **Spec A1 (Honesty-Humility)**; an agent representing a low-H principal should be met with more explicit commitments and guardrails by the counterparty.
- **Conflict mode** — how this principal wants disagreement escalated or resolved.

Exchanged as **structured parameters**, consumed by a protocol — not performed as personality.

## The real tension: efficiency vs. legibility

Two agents with aligned-enough goals _could_ drop into a compressed or emergent representation more efficient than English. The cost is **auditability**: opaque protocols mean humans lose oversight and can't debug or trust the exchange. For a brand whose thesis is _trust and "the honesty science demands,"_ the answer is **structured-but-legible** (typed schemas a human can inspect) — never opaque emergent codes. Efficiency you can't audit is a liability.

## Anchor scenario — the agent as bounded proxy while you're away

The strongest, most concrete instantiation of "agent represents principal." High value (continuity while you're out), high risk (an agent committing things you wouldn't). Every piece above pays off here at once:

| Concern | Mechanism | Source |
|---|---|---|
| Integrity floor; no over-promising to look good in your absence | trust prior + represent your own H standard | **A1 — Honesty-Humility** |
| "What would Jin actually do here?" | decide against your value priorities | **B — Values** |
| Act vs. defer | reversible + in-mandate → act & log; irreversible / out-of-mandate → queue | risk posture (O/C) + explicit mandate |
| Render to the human coworker | their preferred channel/pace/candor | **A2 — comms layer** |
| Report back to you on return | your reader-vs-listener style; what it did/committed/deferred | **A2 — managing-up layer** |
| Two proxies coordinating (both principals out) | exchange negotiation profiles, compute protocol | **future — agent_handshake** |

**Design stance (brand-critical):** a proxy must **never silently impersonate the user.** It acts with **disclosed, bounded, auditable authority** — "acting on Jin's behalf; can commit to A–C; relaying D for Jin's return." Bounded-and-legible, never opaque. Over-delegation (a proxy that quietly commits beyond its mandate) is the central trust hazard to design against.

Mandate dimensions to make explicit (not inferred from the blueprint alone):
- **Scope** — what classes of decision are in/out (approve under $X, reschedule but not cancel, never sign).
- **Stakes/reversibility gate** — the act-vs-defer threshold.
- **Expiry** — the mandate ends when you return; the proxy hands off with an audit log.
- **Disclosure** — counterparties are told they're dealing with a bounded proxy, not the user.

## Product implication — `agent_handshake` (future Spec C)

Extends what already exists. `compare_dyad` today produces _human-readable_ fit + frictions for two **people**. The agent-to-agent version: two **agents** exchange machine-readable negotiation profiles (risk posture, value priorities, H trust prior, conflict mode, commitment preferences) and compute an **interaction protocol** — commitment formality, conflict-escalation path, value-tradeoff rules — before they start working. Consumed by machines, gated by legibility.

`compare_dyad` (human-read) → `agent_handshake` (machine-consumed, bounded, auditable).

## Build dependency

`A1 → A2 → B → C (agent_handshake / proxy mandate)`. The proxy scenario is meaningless without Values (B) as the decision criteria and Honesty-Humility (A1) as the trust prior, so it stays downstream.
