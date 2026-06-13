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
  const code = encodeShareCode(profile);

  useEffect(() => {
    fetch(`/api/observe?code=${encodeURIComponent(code)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => setOverlay((d.overlay ?? null) as ObservedOverlay | null))
      .catch((s) => { if (s === 503) setPaused(true); else setOverlay(null); });
  }, [code]);

  const clearAll = () => {
    fetch(`/api/observe?code=${encodeURIComponent(code)}`, { method: "DELETE" })
      .then(() => setOverlay(null))
      .catch(() => { /* ignore */ });
  };

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
      ) : !overlay ? (
        <p className="footnote">
          No agent observations yet. Connect an assistant via the{" "}
          <span className="num">MCP</span> endpoint and have it call{" "}
          <span className="num">submit_observation</span> after working with you — behavioral
          summaries (never private content) fold in here, recency-weighted, and the yearly Full
          Test re-anchors the measured side.
        </p>
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
          <div className="no-print" style={{ marginTop: "var(--s-6)" }}>
            <button className="btn quiet" onClick={clearAll}>Clear observations</button>
          </div>
        </>
      )}
    </section>
  );
}
