"use client";

import { useEffect, useState } from "react";
import { encodeShareCode } from "@/lib/codec";
import { longDate } from "@/lib/dates";
import type { ObservedOverlay, OverlayTag } from "@/lib/observed";
import type { Profile } from "@/lib/types";

// The "observed" layer (continuous-tuning Phase 3): how the agents you work
// with describe your day-to-day style, synthesized server-side. Distinct from
// the measured trait scores — only the yearly Full Test moves those.

function TagRow({ label, tags }: { label: string; tags: OverlayTag[] }) {
  if (!tags.length) return null;
  return (
    <div style={{ marginBottom: "var(--s-4)" }}>
      <span className="label num">{label}</span>
      <div className="flags" style={{ marginTop: "var(--s-3)" }}>
        {tags.map((t) => (
          <span key={t.tag} className={`flag ${t.confidence === "high" ? "ok" : "num"}`}>
            {t.tag.replace(/-/g, " ")}{t.agents > 1 ? ` · ${t.agents} agents` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ObservedLayer({ profile }: { profile: Profile }) {
  const [overlay, setOverlay] = useState<ObservedOverlay | null | undefined>(undefined);
  const [paused, setPaused] = useState(false);
  const [enabled, setEnabledState] = useState<boolean>(false);
  const [agentIds, setAgentIds] = useState<string[]>([]);
  const [pausedAgents, setPausedAgents] = useState<string[]>([]);
  const code = encodeShareCode(profile);

  useEffect(() => {
    fetch(`/api/observe?code=${encodeURIComponent(code)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        setOverlay((d.overlay ?? null) as ObservedOverlay | null);
        setAgentIds(Array.isArray(d.agentIds) ? d.agentIds : []);
        setPausedAgents(Array.isArray(d.paused) ? d.paused : []);
        setEnabledState(Boolean(d.enabled));
      })
      .catch((s) => { if (s === 503) setPaused(true); else setOverlay(null); });
  }, [code]);

  const setEnabled = (next: boolean) => {
    setEnabledState(next); // optimistic
    fetch(`/api/observe`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, enabled: next }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { if (typeof d.enabled === "boolean") setEnabledState(d.enabled); })
      .catch(() => { /* keep optimistic state */ });
  };

  const clearAll = () => {
    fetch(`/api/observe?code=${encodeURIComponent(code)}`, { method: "DELETE" })
      .then(() => setOverlay(null))
      .catch(() => { /* ignore */ });
  };

  const setPausedList = (next: string[]) => {
    setPausedAgents(next); // optimistic
    fetch(`/api/observe`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, paused: next }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { if (Array.isArray(d.paused)) setPausedAgents(d.paused); })
      .catch(() => { /* keep optimistic state */ });
  };

  const toggleAgent = (agent: string) => {
    setPausedList(
      pausedAgents.includes(agent)
        ? pausedAgents.filter((a) => a !== agent)
        : [...pausedAgents, agent],
    );
  };

  // Agents that have been paused may no longer appear in agentIds (their newer
  // submissions were dropped), so union the two so a paused agent is always listed.
  const manageable = [...new Set([...agentIds, ...pausedAgents])];

  if (overlay === undefined && !paused) return null; // still loading

  return (
    <section className="report-section">
      <span className="label gold">How you actually show up · observed</span>
      <p className="prose" style={{ margin: "var(--s-3) 0 var(--s-4)" }}>
        The living layer: how the AI agents you work with describe your day-to-day style —
        separate from your measured scores, which only the yearly Full Test moves.
      </p>

      {paused ? (
        <p className="footnote">The observation layer is paused right now.</p>
      ) : !enabled ? (
        <div className="no-print">
          <p className="footnote" style={{ marginBottom: "var(--s-4)" }}>
            The observed layer is <strong>off by default</strong>. Until you turn it on, no
            agent can record anything about you on the server — your blueprint stays in this
            browser. Turn it on and the assistants you work with can fold behavioral summaries
            (never private content) in here; turn it off any time and submissions stop at the door.
          </p>
          <button className="btn solid" onClick={() => setEnabled(true)}>Enable the observed layer</button>
        </div>
      ) : !overlay ? (
        <>
          <p className="footnote">
            No agent observations yet. Connect an assistant via the{" "}
            <span className="num">MCP</span> endpoint and have it call{" "}
            <span className="num">submit_observation</span> after working with you — behavioral
            summaries (never private content) fold in here, recency-weighted, and the yearly Full
            Test re-anchors the measured side.
          </p>
          <div className="no-print" style={{ marginTop: "var(--s-5)" }}>
            <button className="btn quiet" onClick={() => setEnabled(false)}>Turn off the observed layer</button>
          </div>
        </>
      ) : (
        <>
          <p className="prose" style={{ marginBottom: "var(--s-6)" }}>{overlay.narrative}</p>
          <TagRow label="Communication" tags={overlay.communication} />
          <TagRow label="Work style" tags={overlay.work_style} />
          <TagRow label="Strategies" tags={overlay.strategies} />
          <TagRow label="Quirks" tags={overlay.quirks} />
          <TagRow label="What works" tags={overlay.worked} />
          <TagRow label="What doesn't" tags={overlay.didnt} />
          <p className="footnote" style={{ marginTop: "var(--s-4)" }}>
            {overlay.observations} observation{overlay.observations === 1 ? "" : "s"} from{" "}
            {overlay.agents || "your"} agent{overlay.agents === 1 ? "" : "s"} · updated {longDate(overlay.updated)}.
            Confidence rises with agreement across agents and recency.
          </p>

          {manageable.length > 0 && (
            <div className="no-print" style={{ marginTop: "var(--s-6)" }}>
              <span className="label num">Contributing agents</span>
              <p className="footnote" style={{ margin: "var(--s-3) 0 var(--s-3)" }}>
                Pause any agent to stop folding in its observations. Paused agents&rsquo; future
                submissions are dropped at the door; already-recorded ones fade out with recency.
              </p>
              <div className="flags">
                {manageable.map((agent) => {
                  const isPaused = pausedAgents.includes(agent);
                  return (
                    <button
                      key={agent}
                      className={`flag ${isPaused ? "" : "ok"}`}
                      style={{ cursor: "pointer", opacity: isPaused ? 0.55 : 1 }}
                      onClick={() => toggleAgent(agent)}
                      title={isPaused ? "Paused — click to resume" : "Active — click to pause"}
                    >
                      {agent}{isPaused ? " · paused" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="no-print" style={{ marginTop: "var(--s-5)", display: "flex", gap: "var(--s-3)", flexWrap: "wrap" }}>
            <button className="btn quiet" onClick={clearAll}>Clear observations</button>
            <button className="btn quiet" onClick={() => setEnabled(false)}>Turn off the observed layer</button>
          </div>
        </>
      )}
    </section>
  );
}
