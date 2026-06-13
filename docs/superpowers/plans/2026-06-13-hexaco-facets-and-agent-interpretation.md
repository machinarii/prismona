# HEXACO Facets + Framework-Grounded Agent Interpretation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Honesty-Humility a faceted full-tier domain and surface trusted communication/managing-up frameworks in the agent-facing outputs.

**Architecture:** A1 adds a 16-item faceted H bank to the full tier — facet scoring/display is already generic, so it flows through with no engine change. A2 extends three existing modules (`manual.ts`, `management.ts`, `mcpguide.ts`); the manual/AI views render sections generically, so new content appears with no component changes.

**Tech Stack:** TypeScript, Next.js App Router, Vitest. All interpretation is deterministic/trait-derived (no LLM), matching the existing house style.

Spec: `docs/superpowers/specs/2026-06-13-hexaco-facets-and-agent-interpretation-design.md`

---

## File map

- `lib/items.ts` — add `H_FULL` faceted bank; `buildFull()` uses it (was `H_ITEMS`). `H_ITEMS` (6, domain-level) stays for quick/standard.
- `lib/scoring.ts` — **no change** (facet bucketing by `it.f` and `NORMS[f.domain]`/`FACET_SD` already handle H facets).
- `lib/norms.ts` — **no change** (H facet z uses `NORMS.H.m` + `FACET_SD`, both already exist).
- `lib/manual.ts` — add one H-keyed entry to the `communication` section.
- `lib/management.ts` — add `TEXT.managingUp` row + a `managingUp` section in `managementStyle()`.
- `lib/mcpguide.ts` — mention Honesty-Humility + managing-up/candor in the tool table.
- `app/blueprint/page.tsx:284` — heading copy "Thirty facets" → "Thirty-four facets".
- `app/assess/page.tsx:80`, `app/page.tsx:69`, `lib/export.ts:40` — full-tier item-count copy.
- Tests: `lib/__tests__/items.test.ts`, `scoring.test.ts`, `manual.test.ts`, `management.test.ts` (create or extend).

Build order: **A1 (Tasks 1–4) → A2 (Tasks 5–8)**.

---

## Task 1: Faceted Honesty-Humility item bank (A1)

**Files:**
- Modify: `lib/items.ts`
- Test: `lib/__tests__/items.test.ts` (create if absent)

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/items.test.ts
import { describe, expect, it } from "vitest";
import { itemsForTier, QUICK_TEST, STANDARD_TEST } from "../items";

const H_FACETS = ["Sincerity", "Fairness", "Greed-Avoidance", "Modesty"];

describe("faceted Honesty-Humility (full tier)", () => {
  const full = itemsForTier("full");
  const hItems = full.filter((i) => i.k === "H" && i.chk === undefined);

  it("full tier has 16 scored H items", () => {
    expect(hItems.length).toBe(16);
  });

  it("every H item is tagged with one of the four facets", () => {
    for (const it of hItems) expect(H_FACETS).toContain(it.f);
  });

  it("has 4 items per H facet", () => {
    for (const f of H_FACETS) {
      expect(hItems.filter((i) => i.f === f).length).toBe(4);
    }
  });

  it("quick and standard keep H domain-level (no facets)", () => {
    const qh = QUICK_TEST.filter((i) => i.k === "H");
    const sh = STANDARD_TEST.filter((i) => i.k === "H");
    expect(qh.length).toBe(6);
    expect(sh.length).toBe(6);
    expect(qh.every((i) => i.f === undefined)).toBe(true);
    expect(sh.every((i) => i.f === undefined)).toBe(true);
  });

  it("full tier totals 138 presented items (120 + 16 H + 2 attention)", () => {
    expect(full.length).toBe(138);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/items.test.ts`
Expected: FAIL — full tier currently has 6 H items, length 128.

- [ ] **Step 3: Add the `H_FULL` bank and swap it into `buildFull()`**

In `lib/items.ts`, after the `H_ITEMS` declaration (ends line 39), add:

```ts
// Full-tier Honesty-Humility: four IPIP HEXACO facets × 4 public-domain markers
// (Ashton, Lee & Goldberg, 2007), keying balanced per facet. Quick/standard keep
// the 6 domain-level H_ITEMS above. NOTE: verify wording against ipip.ori.org
// before shipping — these are the canonical IPIP HH facet markers.
export const H_FULL: Item[] = [
  // Sincerity
  { t: "I wouldn't use flattery to get a raise or promotion, even if I thought it would work.", k: "H", f: "Sincerity", r: false },
  { t: "I wouldn't pretend to like someone just to get favors out of them.", k: "H", f: "Sincerity", r: false },
  { t: "I'll laugh at someone's worst jokes if I want something from them.", k: "H", f: "Sincerity", r: true },
  { t: "I'm willing to be a little insincere with people to get what I want.", k: "H", f: "Sincerity", r: true },
  // Fairness
  { t: "I would never accept a bribe, even a large one.", k: "H", f: "Fairness", r: false },
  { t: "I would never take things that aren't mine.", k: "H", f: "Fairness", r: false },
  { t: "I'd be tempted to buy stolen property if money were tight.", k: "H", f: "Fairness", r: true },
  { t: "I'd be willing to cut a few corners to get ahead.", k: "H", f: "Fairness", r: true },
  // Greed-Avoidance
  { t: "Having a lot of money is not especially important to me.", k: "H", f: "Greed-Avoidance", r: false },
  { t: "I would get a lot of pleasure from owning expensive luxury goods.", k: "H", f: "Greed-Avoidance", r: true },
  { t: "I'd like to be seen driving around in a very expensive car.", k: "H", f: "Greed-Avoidance", r: true },
  { t: "I would enjoy belonging to an exclusive, high-status club.", k: "H", f: "Greed-Avoidance", r: true },
  // Modesty
  { t: "I am an ordinary person who is no better than others.", k: "H", f: "Modesty", r: false },
  { t: "I wouldn't want people to treat me as more important than them.", k: "H", f: "Modesty", r: false },
  { t: "I think I'm entitled to more respect than the average person.", k: "H", f: "Modesty", r: true },
  { t: "I want people to know that I am someone of high status.", k: "H", f: "Modesty", r: true },
];
```

Then change `buildFull()` (currently line ~86) from:

```ts
  const out: Item[] = [...IPIP120_ITEMS, ...H_ITEMS];
```

to:

```ts
  const out: Item[] = [...IPIP120_ITEMS, ...H_FULL];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/items.test.ts`
Expected: PASS (all 5).

- [ ] **Step 5: Commit**

```bash
git add lib/items.ts lib/__tests__/items.test.ts
git -c user.name='admin-41853076' -c user.email='admin@sensingapparatus.com' commit -m "A1: faceted Honesty-Humility item bank (full tier, 16 items, 4 facets)"
```

---

## Task 2: Verify H facet scoring (A1)

Scoring needs **no code change** — `scoreTest` buckets any item with `it.f` into `facets[\`${it.k}:${it.f}\`]` and scores it with `NORMS[f.domain].m` (= `NORMS.H.m`) and `FACET_SD`. H facets are keyed positive (not N-inverted). This task locks that behavior with a test.

**Files:**
- Test: `lib/__tests__/scoring.test.ts` (extend; create if absent)

- [ ] **Step 1: Write the failing test**

```ts
// add to lib/__tests__/scoring.test.ts
import { describe, expect, it } from "vitest";
import { itemsForTier } from "../items";
import { scoreTest } from "../scoring";
import type { Answer } from "../types";

const answerAll = (n: number, value: number): Answer[] =>
  Array.from({ length: n }, () => ({ value, latencyMs: 3000, timedOut: false }));

describe("H facets in full-tier scoring", () => {
  const items = itemsForTier("full");
  // mid-scale answers on every item, including attention checks (value 3 ≠ chk 1/5,
  // which is fine — attention items don't affect trait/facet scores).
  const profile = scoreTest(items, answerAll(items.length, 3), "full");

  it("produces four H facet scores", () => {
    const hFacets = profile.facets.filter((f) => f.domain === "H");
    expect(hFacets.map((f) => f.name).sort()).toEqual(
      ["Fairness", "Greed-Avoidance", "Modesty", "Sincerity"],
    );
  });

  it("H facets carry valid percentile bands", () => {
    for (const f of profile.facets.filter((f) => f.domain === "H")) {
      expect(f.pct).toBeGreaterThanOrEqual(1);
      expect(f.pct).toBeLessThanOrEqual(99);
      expect(f.lo).toBeLessThanOrEqual(f.pct);
      expect(f.hi).toBeGreaterThanOrEqual(f.pct);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it passes immediately**

Run: `npx vitest run lib/__tests__/scoring.test.ts`
Expected: PASS — confirms the generic facet path already handles H. (If it FAILS, the H items lack `f` tags — revisit Task 1.)

- [ ] **Step 3: Commit**

```bash
git add lib/__tests__/scoring.test.ts
git -c user.name='admin-41853076' -c user.email='admin@sensingapparatus.com' commit -m "A1: lock H facet scoring behavior with test"
```

---

## Task 3: H facets display + item-count copy (A1)

The breakdown facet grid (`app/blueprint/page.tsx:286`) iterates `FACET_DOMAIN_ORDER` (includes `H`) and filters `profile.facets` by domain — so H facets render automatically. Only copy changes: the "Thirty facets" heading (now 34) and the full-tier item counts.

**Files:**
- Modify: `app/blueprint/page.tsx:284`, `app/assess/page.tsx:80`, `app/page.tsx:69`, `lib/export.ts:40`

- [ ] **Step 1: Update facet section heading**

`app/blueprint/page.tsx` line 284 — change `Thirty facets` to `Thirty-four facets`:

```tsx
          <span className="label"><span className="roman" style={{ fontSize: "1em" }}>III</span> &nbsp;·&nbsp; Thirty-four facets</span>
```

- [ ] **Step 2: Update the assessment brief item count**

`app/assess/page.tsx` line 80 — change the full-tier label from `Full Test · 128 statements · ~20 minutes` to `Full Test · 138 statements · ~20 minutes`.

- [ ] **Step 3: Update the landing tier table**

`app/page.tsx` line 69 — change `126 items · ~20 min` to `136 items · ~20 min`.

- [ ] **Step 4: Update the export provenance string**

`lib/export.ts` line 40 — change `IPIP-NEO-120 + IPIP HEXACO Honesty-Humility (126 scored items)` to `IPIP-NEO-120 + IPIP HEXACO Honesty-Humility (136 scored items)`.

- [ ] **Step 5: Verify build**

Run: `npx next build`
Expected: Errors: 0 | Warnings: 0.

- [ ] **Step 6: Commit**

```bash
git add app/blueprint/page.tsx app/assess/page.tsx app/page.tsx lib/export.ts
git -c user.name='admin-41853076' -c user.email='admin@sensingapparatus.com' commit -m "A1: H facets display (heading) + full-tier item-count copy"
```

---

## Task 4: Run full suite — A1 checkpoint

- [ ] **Step 1: Run everything**

Run: `npx vitest run && npx next lint && npx next build`
Expected: all tests pass; lint 0 errors; build 0 errors. **A1 is independently shippable here.**

---

## Task 5: Surface Honesty-Humility in the manual (A2.1)

`manual.ts` currently keys only on E/A/C/O/ES — H is invisible in the "working with me" handout. Add one H-keyed entry to the `communication` section.

**Files:**
- Modify: `lib/manual.ts`
- Test: `lib/__tests__/manual.test.ts` (create if absent)

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/manual.test.ts
import { describe, expect, it } from "vitest";
import { buildManual } from "../manual";
import type { Profile, TraitScore } from "../types";

const band = (pct: number): TraitScore => ({ z: 0, pct, lo: pct, hi: pct });
const profileWith = (hPct: number): Profile => ({
  v: 1, tier: "full", date: "2026-06-13",
  traits: { O: band(50), C: band(50), E: band(50), A: band(50), ES: band(50), H: band(hPct) },
  facets: [], archetypes: [], quality: {} as Profile["quality"],
});

describe("manual surfaces Honesty-Humility", () => {
  const comm = (p: Profile) => buildManual(p).find((s) => s.key === "communication")!;

  it("communication section has a candor entry", () => {
    expect(comm(profileWith(50)).entries.some((e) => e.title === "Candor")).toBe(true);
  });

  it("candor copy differs across H tiers", () => {
    const hi = comm(profileWith(85)).entries.find((e) => e.title === "Candor")!.body;
    const lo = comm(profileWith(15)).entries.find((e) => e.title === "Candor")!.body;
    expect(hi).not.toEqual(lo);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/manual.test.ts`
Expected: FAIL — no "Candor" entry exists.

- [ ] **Step 3: Add the H-keyed entry**

In `lib/manual.ts`, inside the `communication` section's `entries` array (after the "Directness" entry, before the closing `]` at line ~37), add:

```ts
        {
          title: "Candor",
          body: pick({
            hi: "I say the straight version and assume you will too — I read positioning and politics as a tax on the work. Give me the real state of things; I'd rather have the hard truth than a managed one, and I'll share credit and own my mistakes first.",
            mid: "I'm honest but tactful — I'll tell you what I think without making it a weapon, and I expect the same plain dealing back. Straight talk builds trust with me fast.",
            lo: "I'm comfortable with strategic framing and working an angle, so put what matters in writing and keep commitments explicit — a handshake where a contract belongs is where friction will start.",
          }, t.H.pct),
        },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/manual.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/manual.ts lib/__tests__/manual.test.ts
git -c user.name='admin-41853076' -c user.email='admin@sensingapparatus.com' commit -m "A2.1: surface Honesty-Humility (candor) in the working-with-me manual"
```

---

## Task 6: Managing-up section in management style (A2.2)

Add a `managingUp` row to the `TEXT` table and a `managingUp` section to `managementStyle()`. Grounded in Gabarro & Kotter (expectations, information flow, dependability, time), Drucker (reader vs. listener via E), and LMX (no-surprises trust). The `management_style` MCP tool and `AiSheet` render it automatically (both iterate `style.sections`).

**Files:**
- Modify: `lib/management.ts`
- Test: `lib/__tests__/management.test.ts` (create if absent)

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/management.test.ts
import { describe, expect, it } from "vitest";
import { managementStyle } from "../management";
import type { Profile, TraitScore } from "../types";

const band = (pct: number): TraitScore => ({ z: 0, pct, lo: pct, hi: pct });
const profile = (over: Partial<Record<"O" | "C" | "E" | "A" | "ES" | "H", number>>): Profile => ({
  v: 1, tier: "full", date: "2026-06-13",
  traits: {
    O: band(over.O ?? 50), C: band(over.C ?? 50), E: band(over.E ?? 50),
    A: band(over.A ?? 50), ES: band(over.ES ?? 50), H: band(over.H ?? 50),
  },
  facets: [], archetypes: [], quality: {} as Profile["quality"],
});

describe("managing-up section", () => {
  it("is present in the output sections", () => {
    const s = managementStyle(profile({ C: 90 }));
    expect(s.sections.some((sec) => sec.key === "managingUp")).toBe(true);
  });

  it("has a heading 'How to manage up to me'", () => {
    const s = managementStyle(profile({ C: 90 }));
    expect(s.sections.find((sec) => sec.key === "managingUp")!.heading).toBe("How to manage up to me");
  });

  it("low emotional stability yields the 'first reaction' guidance", () => {
    const s = managementStyle(profile({ ES: 10 }));
    const up = s.sections.find((sec) => sec.key === "managingUp")!;
    expect(up.entries.map((e) => e.body).join(" ")).toMatch(/first reaction/i);
  });

  it("falls back gracefully when no trait is spiked", () => {
    const up = managementStyle(profile({})).sections.find((sec) => sec.key === "managingUp")!;
    expect(up.entries.length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/__tests__/management.test.ts`
Expected: FAIL — no `managingUp` section.

- [ ] **Step 3: Add the `TEXT.managingUp` row**

In `lib/management.ts`, inside the `TEXT` object (it ends at line ~159 with the `H` block closing `},`), add a new top-level key after the existing last section block:

```ts
  managingUp: {
    O: {
      hi: "Bring the novel option, but pre-answer 'what's the boring version?' — I'll back the idea faster once I see you've stress-tested it.",
      lo: "Lead with the proven option and the precedent; introduce anything novel only after the safe path is on the table.",
    },
    C: {
      hi: "Put the important agreements in writing — who does what by when. I track commitments and I expect you to as well.",
      lo: "Proactively restate what we've agreed and re-confirm deadlines; don't assume a verbal yes is logged.",
    },
    E: {
      hi: "Talk it through first, then confirm in writing — I process out loud, and a cold memo reads as being managed.",
      lo: "Send a tight brief before you ask for time — I'd rather read and reflect than be talked at.",
    },
    A: {
      hi: "Name tension early and gently — I'll smooth over friction, so make it safe to surface the hard thing.",
      lo: "Bring your reasoning, not your feelings — I argue with ideas and respect a direct, well-made case.",
    },
    ES: {
      hi: "I stay level under pressure — raise hard news directly and expect a measured response.",
      lo: "Don't negotiate with my first reaction — deliver hard news once, calmly, and give it an hour before you need a decision.",
    },
    H: {
      hi: "No spin, ever — I hold a high integrity bar and read positioning as a cost. Be straight, share credit, and flag your own mistakes first.",
      lo: "Keep commitments explicit and get the important things in writing — informal understandings are where trust will fray.",
    },
  },
```

- [ ] **Step 4: Build the section in `managementStyle()`**

In `lib/management.ts`, inside `managementStyle()`, after the `moves` block is computed (before the `return {`), add:

```ts
  const managingUpKeys = spiked.slice(0, 4);
  const managingUp = managingUpKeys.length
    ? managingUpKeys.map((k) => entry("managingUp", k))
    : [{ body: "No spiked trait to key on — manage up by the universals: explicit expectations, no surprises, and bring decisions rather than status.", strength: "light" as Strength }];
```

Then add the section to the returned `sections` array, after the `moves` entry:

```ts
      { key: "moves", heading: "Best-practice moves", entries: moves },
      { key: "managingUp", heading: "How to manage up to me", entries: managingUp },
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/__tests__/management.test.ts`
Expected: PASS (all 4).

- [ ] **Step 6: Commit**

```bash
git add lib/management.ts lib/__tests__/management.test.ts
git -c user.name='admin-41853076' -c user.email='admin@sensingapparatus.com' commit -m "A2.2: managing-up section in management style (Gabarro/Kotter, Drucker, LMX)"
```

---

## Task 7: MCP guide — surface H + managing-up (A2.4)

`mcpguide.ts` has zero H references. Update the tool table so agents know the profile carries Honesty-Humility and that `interaction_guide` / `management_style` include candor and managing-up guidance.

**Files:**
- Modify: `lib/mcpguide.ts`

- [ ] **Step 1: Update three table rows**

In `lib/mcpguide.ts`, edit the rows (lines ~22, 29, 31):

`decode_profile` row — append to its description:
```
\`decode_profile\` | \`{ "code": "PRSM-…" }\` → percentiles across six factors **incl. Honesty-Humility**, ±1 SEM ranges, archetype blend, distinctiveness
```

`interaction_guide` row — change the outcome text to:
```
\`{ "code": "PRSM-…" }\` → third-person guidance (channel, pacing, directness, **candor**); follow it
```

`management_style` row — change the outcome text to:
```
\`{ "code": "PRSM-…" }\` → questionnaire default + **how to manage up to them** + weekly field notes (field notes win)
```

- [ ] **Step 2: Verify build**

Run: `npx next build`
Expected: Errors: 0 | Warnings: 0.

- [ ] **Step 3: Commit**

```bash
git add lib/mcpguide.ts
git -c user.name='admin-41853076' -c user.email='admin@sensingapparatus.com' commit -m "A2.4: surface Honesty-Humility + managing-up in the MCP agent guide"
```

---

## Task 8: Final verification + deploy to qa

- [ ] **Step 1: Full suite**

Run: `npx vitest run && npx next lint && npx next build`
Expected: all tests pass; lint 0 errors; build 0 errors.

- [ ] **Step 2: Push**

```bash
git push origin qa
```

- [ ] **Step 3: Deploy + alias to qa.prismona.io**

Use the standard background deploy/poll/alias helper (deploy preview, poll `vercel ls prismona` until Ready, `vercel alias set <url> qa.prismona.io`, curl check). Expect `qa -> 401` (SSO gate) — that is success, not failure.

---

## Self-review

**Spec coverage:**
- A1 items/facets → Task 1. ✓
- A1 scoring (no change) → Task 2 locks it. ✓
- A1 norms (no change) → noted in file map (uses `NORMS.H.m` + `FACET_SD`). ✓
- A1 display + count copy → Task 3. ✓
- A2.1 H in comms outputs → Task 5 (manual). `interactionGuide` already carries H via `APPROACH[H]`, so no change there — noted. ✓
- A2.2 managing-up → Task 6. ✓
- A2.3 on-site cards → satisfied automatically (ManualSheet line 53 + AiSheet line 170 iterate sections generically); printable because ManualSheet/AiSheet already print. No task needed — documented here. ✓
- A2.4 MCP guide → Task 7. ✓

**Placeholder scan:** Item wording carries a verify-against-ipip.ori.org note (psychometric fidelity), but the actual item text is present — not a placeholder. No TBD/TODO elsewhere.

**Type consistency:** `entry()`, `spiked`, `Strength`, `StyleEntry`, `pick`, `t` (= `p.traits`) all match their existing definitions in `management.ts`/`manual.ts`. New `H_FULL` is `Item[]`, matching `H_ITEMS`. Facet names match across Task 1 (items), Task 2 (scoring assertions), and the four HEXACO facets throughout.

**Out of scope (per spec):** Schwartz Values (Spec B); agent_handshake / proxy mandate (future Spec C).
