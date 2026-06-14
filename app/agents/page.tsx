"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadLatest } from "@/lib/storage";
import { encodeShareCode } from "@/lib/codec";
import {
  agentPersona, PERSONA_ROLES, PERSONA_FLAVORS, type RoleKey, type FlavorKey,
} from "@/lib/persona";
import { composeAgents } from "@/lib/compose";
import { encodeTeamCode, loadTeam, saveTeam, newTeamId, type TeamAgent } from "@/lib/agentteam";
import type { Profile } from "@/lib/types";

// The Agent Team Composer (/agents): assemble a small bench of role + voice
// agents that complement your blueprint, publish them, and export their
// personas. Persona generation is the existing complement model (agentPersona);
// the team encodes to a self-contained PRSM-TEAM- code agents can pull via MCP.

const ROLE_KEYS = Object.keys(PERSONA_ROLES) as RoleKey[];
const FLAVOR_KEYS = Object.keys(PERSONA_FLAVORS) as FlavorKey[];

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : `a${Date.now().toString(36)}`;

function CopyButton({ text, label, copiedLabel = "Copied", primary = false }:
  { text: string; label: string; copiedLabel?: string; primary?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={primary ? "btn" : "btn quiet"}
      style={primary ? { background: "var(--gold)", color: "var(--ink, #15161a)", borderColor: "var(--gold)" } : undefined}
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }).catch(() => { /* ignore */ });
      }}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

// Phase 2: the learned overlay for one published agent — what its interactions
// taught it, with a reset. Transparent + revertible; no silent persona drift.
function LearnedRow({ teamCode, agentId }: { teamCode: string; agentId: string }) {
  const [overlay, setOverlay] = useState<{ worked: string[]; adjust: string[]; reports: number } | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/api/agentlearn?teamCode=${encodeURIComponent(teamCode)}&agentId=${encodeURIComponent(agentId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { if (live) setOverlay(d.overlay ?? null); })
      .catch(() => { if (live) setOverlay(null); });
    return () => { live = false; };
  }, [teamCode, agentId]);
  const reset = () => {
    fetch(`/api/agentlearn?teamCode=${encodeURIComponent(teamCode)}&agentId=${encodeURIComponent(agentId)}`, { method: "DELETE" })
      .then(() => setOverlay(null)).catch(() => { /* ignore */ });
  };
  if (!overlay) return null;
  return (
    <div className="footnote" style={{ marginTop: "var(--s-4)", borderTop: "1px solid var(--hairline-soft)", paddingTop: "var(--s-3)" }}>
      <span className="num" style={{ color: "var(--gold)" }}>Learned</span> · {overlay.reports} report{overlay.reports === 1 ? "" : "s"}
      {overlay.worked.length > 0 && <> · works: {overlay.worked.join(", ")}</>}
      {overlay.adjust.length > 0 && <> · adjust: {overlay.adjust.join(", ")}</>}
      {" · "}
      <button onClick={reset} style={{ background: "none", border: 0, color: "var(--ivory-faint)", cursor: "pointer", textDecoration: "underline", padding: 0, font: "inherit" }}>reset</button>
    </div>
  );
}

export default function AgentsPage() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [agents, setAgents] = useState<TeamAgent[]>([]);
  const [published, setPublished] = useState<TeamAgent[]>([]);
  const [teamId, setTeamId] = useState<string>(newTeamId);

  useEffect(() => {
    const p = loadLatest();
    setProfile(p);
    if (p) {
      const saved = loadTeam();
      if (saved && saved.anchor === encodeShareCode(p)) {
        if (saved.id) setTeamId(saved.id);
        setAgents(saved.agents);
        setPublished(saved.agents);
      }
    }
  }, []);

  if (profile === undefined) return null; // loading

  if (!profile) {
    return (
      <main className="shell reveal">
        <section className="arch-display">
          <p className="label gold">Compose your agent team</p>
          <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "12px 0 16px" }}>
            Working with my agents
          </h1>
          <p className="prose">
            Build a bench of role-based AI agents tuned to complement you — but first you need a
            blueprint to anchor them to.{" "}
            <Link href="/assess?tier=quick" className="cite" style={{ color: "var(--ivory-dim)" }}>
              Take the test
            </Link>{" "}to begin.
          </p>
        </section>
      </main>
    );
  }

  const anchor = encodeShareCode(profile);
  const dirty = JSON.stringify(agents) !== JSON.stringify(published);
  const teamCode = encodeTeamCode({ v: 1, id: teamId, anchor, agents });
  const publishedCode = encodeTeamCode({ v: 1, id: teamId, anchor, agents: published });
  const publishedIds = new Set(published.map((a) => a.id));

  const update = (id: string, patch: Partial<TeamAgent>) =>
    setAgents((a) => a.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const remove = (id: string) => setAgents((a) => a.filter((x) => x.id !== id));
  const addAgent = () => setAgents((a) => [...a, { id: newId(), role: "engineer" }]);
  const suggestBench = () => {
    const plan = composeAgents({ projectType: "launch", size: 4 }, profile);
    setAgents(plan.agents.map((s) => ({ id: newId(), role: s.role, flavor: s.flavor })));
  };
  const publish = () => { saveTeam({ v: 1, id: teamId, anchor, agents }); setPublished(agents); };
  const revert = () => setAgents(published);

  const personaFor = (a: TeamAgent) => agentPersona(profile, { role: a.role, flavor: a.flavor });
  const bundle = () => {
    const origin = typeof location !== "undefined" ? location.origin : "https://prismona.io";
    const header = `Team link: ${origin}/agents#${teamCode}  (agents pull live via MCP — team_personas)`;
    const body = agents
      .map((a) => `— ${PERSONA_ROLES[a.role].name}${a.flavor ? ` (${PERSONA_FLAVORS[a.flavor].name})` : ""}:\n${personaFor(a)}`)
      .join("\n\n");
    return `${header}\n\n${body}`;
  };

  return (
    <main className="shell reveal">
      <section className="arch-display">
        <p className="label gold">Compose your agent team</p>
        <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "12px 0 16px" }}>
          Working with my agents
        </h1>
        <p className="prose">
          A bench of role-based AI agents, each calibrated to complement your blueprint. Pick a role
          and a voice; publish to save and make the team pullable by any MCP agent; copy the personas
          to paste into your orchestrator.
        </p>
      </section>

      <section className="report-section">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--s-4)", flexWrap: "wrap", marginBottom: "var(--s-6)" }}>
          <div>
            <span className="label">{agents.length} agent{agents.length === 1 ? "" : "s"}</span>
            <div className="footnote" style={{ marginTop: "var(--s-2)", color: dirty ? "var(--gold)" : "var(--ivory-faint)" }}>
              {dirty
                ? <>◐ Draft · unsaved changes {published.length > 0 && <button className="link" style={{ background: "none", border: 0, color: "var(--ivory-faint)", cursor: "pointer", textDecoration: "underline" }} onClick={revert}>· revert</button>}</>
                : agents.length > 0 ? "● Live on MCP · saved — agents pull by team code" : "Add an agent or suggest a bench to begin."}
            </div>
          </div>
          <div style={{ display: "flex", gap: "var(--s-3)", flexWrap: "wrap" }}>
            <button className="btn" style={{ background: "var(--gold)", color: "var(--ink, #15161a)", borderColor: "var(--gold)", opacity: dirty ? 1 : 0.5 }} disabled={!dirty} onClick={publish}>
              ↑ Publish
            </button>
            {agents.length > 0 && <CopyButton text={bundle()} label="⧉ Copy team personas" />}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
          {agents.map((a) => (
            <div key={a.id} style={{ border: "1px solid var(--hairline)", borderRadius: "10px", padding: "var(--s-5)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--s-3)", flexWrap: "wrap" }}>
                <select
                  value={a.role}
                  onChange={(e) => update(a.id, { role: e.target.value as RoleKey })}
                  style={{ background: "transparent", color: "var(--gold)", border: "1px solid var(--hairline)", borderRadius: "6px", padding: "var(--s-2) var(--s-3)", fontFamily: "var(--font-label), sans-serif", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "var(--t-xs)" }}
                >
                  {ROLE_KEYS.map((r) => <option key={r} value={r}>{PERSONA_ROLES[r].name}</option>)}
                </select>
                <div style={{ display: "flex", gap: "var(--s-3)", alignItems: "center" }}>
                  <CopyButton text={personaFor(a)} label="Copy persona" />
                  <button className="btn quiet" onClick={() => remove(a.id)} aria-label="Remove agent">✕</button>
                </div>
              </div>
              <div className="flags" style={{ marginTop: "var(--s-4)" }}>
                <button className="flag" aria-pressed={!a.flavor}
                  style={!a.flavor ? { borderColor: "var(--gold)", color: "var(--gold)" } : undefined}
                  onClick={() => update(a.id, { flavor: undefined })}>Default voice</button>
                {FLAVOR_KEYS.map((f) => (
                  <button key={f} className="flag" aria-pressed={a.flavor === f}
                    title={PERSONA_FLAVORS[f].blurb}
                    style={a.flavor === f ? { borderColor: "var(--gold)", color: "var(--gold)" } : undefined}
                    onClick={() => update(a.id, { flavor: f })}>{PERSONA_FLAVORS[f].name}</button>
                ))}
              </div>
              {publishedIds.has(a.id) && !dirty && <LearnedRow teamCode={publishedCode} agentId={a.id} />}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-5)", flexWrap: "wrap" }}>
          <button className="btn quiet" onClick={addAgent}>+ Add agent</button>
          <button className="btn quiet" onClick={suggestBench}>✦ Suggest a bench</button>
        </div>

        <p className="footnote" style={{ marginTop: "var(--s-6)" }}>
          Personas complement your measured blueprint (your lows become their strengths). Connect an
          assistant via the{" "}
          <Link href="/mcp" className="cite" style={{ color: "var(--ivory-dim)" }}>MCP endpoint</Link>{" "}
          and it can pull the whole team live with the <span className="num">team_personas</span> tool.
        </p>
      </section>
    </main>
  );
}
