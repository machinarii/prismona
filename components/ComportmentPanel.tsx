"use client";

import { useEffect, useState } from "react";
import {
  REL_PRESETS, computeComportment, comportmentDirectives, DIMS,
  type RelPreset, type Comportment, type Dim,
} from "@/lib/comportment";

// Comportment panel (spec 2026-06-14): the agent's PERSONA is fixed; its
// COMPORTMENT — register — adapts by relationship. Each dimension is an anchored
// scrubbing bar: the thumb starts at the framework's computed default for the
// chosen relationship (a tick marks it), and the owner nudges from there. Saved
// per relationship preset. The honesty floor is never a slider.

const STORE = "prismona.comportment";
type Overrides = Partial<Record<RelPreset, Partial<Comportment>>>;

const POLES: Record<Dim, [string, string]> = {
  formality: ["casual", "formal"],
  deference: ["assertive", "deferential"],
  warmth: ["reserved", "warm"],
  directness: ["diplomatic", "blunt"],
  disclosure: ["guarded", "open"],
  brevity: ["expansive", "terse"],
};

const clamp = (n: number) => Math.max(-2, Math.min(2, n));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const poleLabel = (d: Dim, v: number) => {
  if (v === 0) return "neutral";
  const word = v < 0 ? POLES[d][0] : POLES[d][1];
  return Math.abs(v) === 2 ? `very ${word}` : word;
};

export function ComportmentPanel() {
  const [preset, setPreset] = useState<RelPreset>("manager");
  const [overrides, setOverrides] = useState<Overrides>({});
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) setOverrides(JSON.parse(raw) as Overrides);
    } catch { /* ignore */ }
  }, []);

  const persist = (next: Overrides) => {
    setOverrides(next);
    try { localStorage.setItem(STORE, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const def = computeComportment({ preset });
  const ov = overrides[preset] ?? {};
  const eff = DIMS.reduce((a, d) => { a[d] = clamp(def[d] + (ov[d] ?? 0)); return a; }, {} as Comportment);
  const nudged = DIMS.some((d) => (ov[d] ?? 0) !== 0);

  const setDim = (d: Dim, value: number) => {
    const delta = value - def[d];
    const nextOv: Partial<Comportment> = { ...ov };
    if (delta === 0) delete nextOv[d]; else nextOv[d] = delta;
    persist({ ...overrides, [preset]: nextOv });
  };
  const resetAll = () => persist({ ...overrides, [preset]: {} });

  return (
    <div>
      <div className="flags" style={{ marginBottom: "var(--s-5)" }}>
        {REL_PRESETS.map((r) => (
          <button key={r.key} className="flag" aria-pressed={preset === r.key}
            title={r.note}
            style={preset === r.key ? { borderColor: "var(--gold)", color: "var(--gold)" } : undefined}
            onClick={() => setPreset(r.key)}>{r.label}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)", border: "1px dashed var(--hairline)", padding: "var(--s-4) var(--s-6)", maxWidth: "var(--measure)" }}>
        {DIMS.map((d) => {
          const deviated = (ov[d] ?? 0) !== 0;
          return (
            <div key={d} style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span className="num" style={{ fontSize: "var(--t-xs)", letterSpacing: "0.06em", color: deviated ? "var(--gold)" : "var(--ivory-dim)" }}>
                  {cap(d)}
                </span>
                <span className="footnote num" style={{ color: deviated ? "var(--gold)" : "var(--ivory-faint)" }}>
                  {poleLabel(d, eff[d])}
                  {deviated && (
                    <button onClick={() => setDim(d, def[d])} title="reset to default"
                      style={{ background: "none", border: 0, color: "var(--ivory-faint)", cursor: "pointer", marginLeft: "var(--s-2)", padding: 0, font: "inherit" }}>↺</button>
                  )}
                </span>
              </div>
              <div style={{ position: "relative" }}>
                <input type="range" min={-2} max={2} step={1} value={eff[d]}
                  onChange={(e) => setDim(d, Number(e.target.value))}
                  aria-label={`${cap(d)} comportment`}
                  style={{ width: "100%", accentColor: "var(--gold)", display: "block" }} />
                <span aria-hidden style={{ position: "absolute", left: `${((def[d] + 2) / 4) * 100}%`, top: "-3px", width: "2px", height: "9px", background: "var(--ivory-faint)", transform: "translateX(-50%)", pointerEvents: "none" }} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "var(--s-4)", marginTop: "var(--s-3)", flexWrap: "wrap" }}>
        <button className="footnote num" onClick={() => setShowPreview((s) => !s)}
          style={{ background: "none", border: 0, color: "var(--ivory-dim)", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
          {showPreview ? "hide" : "preview"} directives
        </button>
        {nudged && (
          <button className="footnote num" onClick={resetAll}
            style={{ background: "none", border: 0, color: "var(--ivory-faint)", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
            reset all to default
          </button>
        )}
      </div>

      {showPreview && (
        <pre className="footnote num" style={{ whiteSpace: "pre-wrap", border: "1px dashed var(--hairline)", padding: "var(--s-4) var(--s-6)", margin: "var(--s-3) 0 0", letterSpacing: 0 }}>
          {comportmentDirectives(eff) || "Neutral — no register adjustments for this relationship."}
        </pre>
      )}
    </div>
  );
}
