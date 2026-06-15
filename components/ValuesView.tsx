"use client";

import { useState } from "react";
import { VALUE_META, QUADRANT_LABEL, valueBrief, type ValuesProfile } from "@/lib/values";

// Renders a scored values profile: ranked priorities, the key tension, and the
// agent-facing value brief (copyable). Reused on /values and in the blueprint.
export function ValuesView({ profile }: { profile: ValuesProfile }) {
  const [copied, setCopied] = useState(false);
  const brief = valueBrief(profile);
  return (
    <div>
      <span className="label">Value priorities</span>
      <div style={{ marginTop: "var(--s-4)", maxWidth: "var(--measure)" }}>
        {profile.scores.map((s) => (
          <div key={s.value} style={{ marginBottom: "var(--s-4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: "var(--t-sm)" }}>
              <span style={{ color: "var(--ivory)" }}>{VALUE_META[s.value].name}</span>
              <span className="footnote num">{QUADRANT_LABEL[VALUE_META[s.value].quadrant]}</span>
            </div>
            <div style={{ height: 6, background: "var(--hairline-soft)", borderRadius: 3, marginTop: "var(--s-2)" }}>
              <div style={{ width: `${s.pct}%`, height: "100%", background: "var(--gold)", borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>

      {profile.tensions.length > 0 && (
        <p className="footnote" style={{ marginTop: "var(--s-4)", maxWidth: "var(--measure)" }}>
          Tension: you prize both <span className="num">{VALUE_META[profile.tensions[0][0]].name}</span> and{" "}
          <span className="num">{VALUE_META[profile.tensions[0][1]].name}</span> — opposite sides of the values
          circle, so they pull against each other.
        </p>
      )}

      <div style={{ marginTop: "var(--s-8)" }}>
        <span className="label gold">Value brief · for your AI</span>
        <pre className="footnote num" style={{ whiteSpace: "pre-wrap", border: "1px dashed var(--hairline)", padding: "var(--s-4) var(--s-6)", margin: "var(--s-3) 0", letterSpacing: 0, maxWidth: "var(--measure)" }}>
          {brief}
        </pre>
        <button className="btn quiet" onClick={() => {
          navigator.clipboard?.writeText(brief).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }).catch(() => { /* ignore */ });
        }}>
          {copied ? "Copied" : "Copy value brief"}
        </button>
      </div>

      <p className="footnote" style={{ marginTop: "var(--s-4)", maxWidth: "72ch" }}>
        Values are self-reported priorities (Schwartz), captured by forced choice — modest predictive
        validity, a guide to what you&apos;re trying to achieve, never a verdict.
      </p>
    </div>
  );
}
