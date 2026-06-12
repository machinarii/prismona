import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MCP — Prismona",
  description:
    "Connect any AI agent to a Prismona personality profile over the Model Context Protocol: hosted endpoint, seven tools, consent carried by share codes.",
};

const ENDPOINT = "https://prismona.vercel.app/api/mcp";

const TOOLS: Array<[string, string]> = [
  ["decode_profile", "Full structured profile from a share code: percentiles, uncertainty ranges, archetype blend, distinctiveness"],
  ["profile_readings", "The six applied readings — relationships, career, work style, leadership, integrity, cofounder"],
  ["compare_dyad", "Pairing report for two codes: fit gauge, strengths, frictions with conversation prompts"],
  ["team_composition", "Two or more codes: trait diversity, role coverage, gaps, single points of failure, gates"],
  ["working_with_me", "The first-person collaboration one-pager"],
  ["agent_persona", "A system prompt calibrating an AI to be the profile owner's complement"],
  ["interaction_guide", "Third-person guidance for communicating with the person behind a code"],
];

function Snippet({ children }: { children: string }) {
  return (
    <pre className="footnote num" style={{
      whiteSpace: "pre-wrap", border: "1px dashed var(--hairline)",
      padding: "var(--s-4) var(--s-6)", margin: "var(--s-3) 0 var(--s-6)", letterSpacing: 0,
      overflowX: "auto",
    }}>{children}</pre>
  );
}

export default function McpPage() {
  return (
    <main className="shell" style={{ paddingTop: "var(--s-16)" }}>
      <p className="label gold">Model Context Protocol</p>
      <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "16px 0 24px", maxWidth: "20ch" }}>
        Plug your AI into a personality.
      </h1>
      <p className="prose">
        A Prismona profile is a digital ID for personality, and this server is how
        agents read it. Connect any MCP-capable assistant — Claude, Cursor, your own
        agent — to the live endpoint below, hand it a share code someone gave you,
        and it can decode the profile, generate readings, compare pairs, read teams,
        and calibrate itself to communicate with that person well.
      </p>

      <section className="section">
        <div className="section-head"><span className="roman">I.</span><h2>Connect</h2></div>
        <p className="prose">
          The hosted endpoint negotiates the protocol live over Streamable HTTP —
          nothing to install, no account, no key:
        </p>
        <Snippet>{ENDPOINT}</Snippet>
        <dl className="ledger">
          <div>
            <dt>Claude Code</dt>
            <dd>
              One command:
              <Snippet>{`claude mcp add --transport http prismona ${ENDPOINT}`}</Snippet>
            </dd>
          </div>
          <div>
            <dt>Claude.ai / Desktop</dt>
            <dd>Settings → Connectors → Add custom connector → paste the endpoint URL.</dd>
          </div>
          <div>
            <dt>Cursor, agents, anything else</dt>
            <dd>
              Standard MCP client config:
              <Snippet>{`{
  "mcpServers": {
    "prismona": { "url": "${ENDPOINT}" }
  }
}`}</Snippet>
            </dd>
          </div>
          <div>
            <dt>Fully offline</dt>
            <dd>
              The same tools ship as a local stdio server (<span className="num">packages/mcp</span> in
              the repository) for setups where profile codes should never leave the machine —
              the hosted endpoint is stateless either way.
            </dd>
          </div>
        </dl>
      </section>

      <section className="section">
        <div className="section-head"><span className="roman">II.</span><h2>Tools</h2></div>
        <dl className="ledger">
          {TOOLS.map(([name, desc]) => (
            <div key={name}>
              <dt><span className="num" style={{ textTransform: "none", letterSpacing: "0.04em" }}>{name}</span></dt>
              <dd>{desc}</dd>
            </div>
          ))}
        </dl>
        <p className="prose" style={{ marginTop: "var(--s-8)" }}>
          Try it: connect, then ask your assistant —{" "}
          <em>&ldquo;Here are our two Prismona codes. Compare us as cofounders and tell me
          which conversation we should have first.&rdquo;</em>
        </p>
      </section>

      <section className="section" style={{ paddingBottom: "var(--s-16)" }}>
        <div className="section-head"><span className="roman">III.</span><h2>Consent &amp; privacy</h2></div>
        <p className="prose">
          Every tool takes a share code as input — and a code only exists because its
          owner generated and handed it over. Possession is the grant; a code shared
          for one purpose is not consent for another. The endpoint is stateless: codes
          are decoded in-process, nothing is stored, and no identity is attached.
          Outputs are probabilistic readings with stated limits — never verdicts, and
          never a basis for screening anyone.{" "}
          <Link href="/method" className="cite">Methodology</Link> ·{" "}
          <Link href="/privacy" className="cite">Privacy Policy</Link>
        </p>
      </section>
    </main>
  );
}
