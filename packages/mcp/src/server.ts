import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { decodeShareCode } from "../../../lib/codec";
import { profileFromShare } from "../../../lib/shareview";
import { buildProfileExport } from "../../../lib/export";
import { buildInsights } from "../../../lib/insights";
import { buildManual } from "../../../lib/manual";
import { agentPersona, interactionGuide } from "../../../lib/persona";
import { compareDyad } from "../../../lib/dyad";
import { teamReport } from "../../../lib/team";
import { distinctiveness } from "../../../lib/rarity";
import { ARCHETYPE_BASE_RATES } from "../../../lib/data/baserates";
import type { ReportKey, ShareProfile } from "../../../lib/types";

// prismona-mcp — the personality digital ID as an agent interface.
//
// Runs locally over stdio: profiles enter as PRSM share codes the user (or
// their counterpart) chose to hand over, every computation happens in this
// process, and nothing is transmitted anywhere. Consent model: possession
// of a code is the grant; a code shared for one purpose is not consent for
// another, and no tool output is ever a verdict on a person.

const server = new McpServer({ name: "prismona", version: "0.1.0" });

const ok = (data: unknown) => ({
  content: [{ type: "text" as const, text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }],
});
const fail = (msg: string) => ({
  content: [{ type: "text" as const, text: `Error: ${msg}` }],
  isError: true as const,
});

function decode(code: string): ShareProfile | null {
  return decodeShareCode(code);
}

const CODE_DESC = "A PRSM share code (PRSM-…), the consent-carried profile token";

server.registerTool(
  "decode_profile",
  {
    title: "Decode a Prismona profile",
    description: "Decode a PRSM share code into the full structured profile: six trait percentiles with ±1 SEM ranges, archetype blend, statistical distinctiveness, and archetype base rate. Self-report estimates with modest effect sizes — never a verdict.",
    inputSchema: { code: z.string().describe(CODE_DESC) },
  },
  async ({ code }) => {
    const share = decode(code);
    if (!share) return fail("invalid share code");
    const profile = profileFromShare(share);
    const z = Object.fromEntries(
      (["O", "C", "E", "A", "ES", "H"] as ReportKey[]).map((k) => [k, profile.traits[k].z]),
    ) as Record<ReportKey, number>;
    return ok({
      ...buildProfileExport(profile, null),
      distinctiveness: distinctiveness(z),
      archetypeBaseRatePct: ARCHETYPE_BASE_RATES[profile.archetypes[0]?.name] ?? null,
    });
  },
);

server.registerTool(
  "profile_readings",
  {
    title: "Applied readings for a profile",
    description: "The six citation-grounded use-case readings (relationships, career, work style, leadership, integrity, cofounder) generated from a profile's percentiles. Each section includes its evidence and an epistemic caveat.",
    inputSchema: { code: z.string().describe(CODE_DESC) },
  },
  async ({ code }) => {
    const share = decode(code);
    if (!share) return fail("invalid share code");
    return ok(buildInsights(profileFromShare(share)));
  },
);

server.registerTool(
  "compare_dyad",
  {
    title: "Compare two profiles",
    description: "Evidence-aligned pairing report for two share codes: 0–100 fit gauge, strengths, and top frictions with structured conversation prompts. Purpose-specific (romantic / cofounder / colleague). Never a binary verdict.",
    inputSchema: {
      codeA: z.string().describe(CODE_DESC),
      codeB: z.string().describe("The second person's PRSM share code"),
      purpose: z.enum(["romantic", "cofounder", "colleague"]).describe("Which pairing lens to apply"),
    },
  },
  async ({ codeA, codeB, purpose }) => {
    const a = decode(codeA);
    const b = decode(codeB);
    if (!a || !b) return fail(`invalid share code: ${!a ? "codeA" : "codeB"}`);
    return ok(compareDyad(a, b, purpose));
  },
);

server.registerTool(
  "team_composition",
  {
    title: "Team composition report",
    description: "Composition read for 2+ share codes: trait diversity, per-trait role coverage with owners, uncovered gaps, single points of failure, and the evidence gates (low Honesty-Humility anywhere; majority low Conscientiousness). Bell 2007 / McCarthy 2023 framing — a prior for conversations, never grounds to exclude anyone.",
    inputSchema: { codes: z.array(z.string()).min(2).describe("Two or more PRSM share codes") },
  },
  async ({ codes }) => {
    const shares = codes.map(decode);
    const badIdx = shares.findIndex((s) => !s);
    if (badIdx >= 0) return fail(`invalid share code at position ${badIdx + 1}`);
    return ok(teamReport(shares as ShareProfile[]));
  },
);

server.registerTool(
  "working_with_me",
  {
    title: "Working-with-me manual",
    description: "First-person collaboration handout generated from a profile: how they communicate, decide, take feedback, handle conflict, manage energy, and what you can count on.",
    inputSchema: { code: z.string().describe(CODE_DESC) },
  },
  async ({ code }) => {
    const share = decode(code);
    if (!share) return fail("invalid share code");
    return ok(buildManual(profileFromShare(share)));
  },
);

server.registerTool(
  "agent_persona",
  {
    title: "Companion persona (for the profile's owner)",
    description: "A system prompt that calibrates an AI to be this person's COMPLEMENT — supplying the structure, calm, candor, or grounding their measured profile suggests they benefit from. Intended for the profile owner's own assistant.",
    inputSchema: { code: z.string().describe(CODE_DESC) },
  },
  async ({ code }) => {
    const share = decode(code);
    if (!share) return fail("invalid share code");
    return ok(agentPersona(profileFromShare(share)));
  },
);

server.registerTool(
  "interaction_guide",
  {
    title: "Interaction guide (for everyone else)",
    description: "Third-person guidance for an agent or human about to interact with the person who shared this code: how to communicate with them well, given their measured profile. The inbound side of the personality digital ID.",
    inputSchema: { code: z.string().describe(CODE_DESC) },
  },
  async ({ code }) => {
    const share = decode(code);
    if (!share) return fail("invalid share code");
    return ok(interactionGuide(profileFromShare(share)));
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
