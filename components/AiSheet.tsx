"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { aiContextBlock } from "@/lib/portable";
import { agentPersona, PERSONA_FLAVORS, type FlavorKey } from "@/lib/persona";
import { loadValues } from "@/lib/storage";
import { valueBrief } from "@/lib/values";
import { profileUrl } from "@/lib/shareview";
import { managementStyle, type FeedbackDigest } from "@/lib/management";
import { encodeShareCode } from "@/lib/codec";
import type { Profile } from "@/lib/types";

function CopyBlock({ summary, action, text, maxHeight, onNaturalHeight, extra }:
  { summary: string; action: string; text: string; maxHeight?: number | null; onNaturalHeight?: (h: number) => void; extra?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);
  useEffect(() => {
    // scrollHeight is the full content height even when maxHeight clips it,
    // so the measured natural height stays stable after the cap is applied.
    if (onNaturalHeight && preRef.current) onNaturalHeight(preRef.current.scrollHeight);
  }, [text, onNaturalHeight]);
  return (
    <div style={{ marginBottom: "var(--s-8)" }}>
      <span className="label gold" style={{ display: "block", marginBottom: "var(--s-3)" }}>
        {summary}
      </span>
      {extra}
      <pre
        ref={preRef}
        className="footnote num"
        style={{
          whiteSpace: "pre-wrap", border: "1px dashed var(--hairline)",
          padding: "var(--s-4) var(--s-6)", margin: "var(--s-4) 0", letterSpacing: 0,
          ...(maxHeight ? { maxHeight: `${maxHeight}px`, overflow: "auto" } : {}),
        }}
      >
        {text}
      </pre>
      <button
        className="btn quiet"
        onClick={() => {
          navigator.clipboard?.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          });
        }}
      >
        {copied ? "Copied" : action}
      </button>
    </div>
  );
}

function CopyAiLink({ profile }: { profile: Profile }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn quiet"
      onClick={() => {
        navigator.clipboard?.writeText(profileUrl(profile, location.origin, "/ai")).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        });
      }}
    >
      {copied ? "Copied" : "Copy link for AI"}
    </button>
  );
}

function FieldNotes({ profile }: { profile: Profile }) {
  const [digest, setDigest] = useState<FeedbackDigest | null>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    fetch(`/api/feedback?code=${encodeURIComponent(encodeShareCode(profile))}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setDigest)
      .catch((s) => { if (s === 503) setPaused(true); });
  }, [profile]);
  if (paused) return <p className="footnote">Field notes are paused right now — the questionnaire default stands alone.</p>;
  if (!digest || digest.weeks.length === 0) {
    return (
      <p className="footnote">
        No field notes yet. Agents that work with you can report what worked and what
        didn&apos;t via the MCP tool <span className="num">report_collaboration</span>;
        notes fold into a weekly digest here and refine the default above.
      </p>
    );
  }
  return (
    <div>
      {digest.weeks.map((w) => (
        <div key={w.week} style={{ marginBottom: "var(--s-6)" }}>
          <span className="label num">
            {w.week}{w.collecting ? " · collecting" : ""} · {w.sources} source{w.sources > 1 ? "s" : ""}
          </span>
          <div className="flags" style={{ marginTop: "var(--s-3)" }}>
            {w.worked.map((x) => <span key={`w${x}`} className="flag ok">{x}</span>)}
            {w.didnt.map((x) => <span key={`d${x}`} className="flag warn">{x}</span>)}
          </div>
        </div>
      ))}
      <p className="footnote">
        Weekly digests of observations reported by agents you worked with — they outrank
        the questionnaire default wherever the two disagree.
      </p>
    </div>
  );
}

// The AI prompt pair, renderable as the profile's third tab or standalone at
// /ai#code — its own distinct share link.
export function AiSheet({ profile }: { profile: Profile }) {
  const style = managementStyle(profile);
  const [mods, setMods] = useState<Partial<Record<FlavorKey, number>>>({});
  const [boxH, setBoxH] = useState<number | null>(null); // half the Agent-context natural height, shared by both boxes
  const [vBrief, setVBrief] = useState("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem("prismona.mods");
      if (raw) setMods(JSON.parse(raw) as Partial<Record<FlavorKey, number>>);
    } catch { /* ignore */ }
    const v = loadValues();
    if (v?.profile) setVBrief(valueBrief(v.profile));
  }, []);
  const setMod = (f: FlavorKey, v: number) => {
    setMods((prev) => {
      const next = { ...prev };
      if (v === 0) delete next[f]; else next[f] = v;
      try { localStorage.setItem("prismona.mods", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };
  const personaText = agentPersona(profile, { flavors: mods });
  return (
    <>
      <section className="arch-display">
        <p className="label gold">Take your blueprint to your agent</p>
        <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "12px 0 16px" }}>
          Working with my AI
        </h1>
        <p className="prose">
          Two blocks to paste into Claude, ChatGPT, or any assistant: the{" "}
          <em>context</em> teaches it who you are; the <em>persona</em> calibrates it
          to complement you.
        </p>
      </section>
      <section className="report-section">
        <CopyBlock summary="Agent context" action="Copy Agent context" text={vBrief ? `${aiContextBlock(profile)}\n\n${vBrief}` : aiContextBlock(profile)}
          maxHeight={boxH} onNaturalHeight={(h) => setBoxH((prev) => prev ?? Math.round(h / 2))} />

        <CopyBlock summary="Agent persona" action="Copy Agent persona" text={personaText} maxHeight={boxH}
          extra={
            <div style={{ margin: "0 0 var(--s-4)" }}>
              <span className="label">Persona Modulation · optional</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)", border: "1px dashed var(--hairline)", padding: "var(--s-4) var(--s-6)", margin: "var(--s-4) 0", maxWidth: "var(--measure)" }}>
                {(Object.keys(PERSONA_FLAVORS) as FlavorKey[]).map((f) => {
                  const v = mods[f] ?? 0;
                  return (
                    <div key={f} style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span className="num" title={PERSONA_FLAVORS[f].blurb}
                          style={{ fontSize: "var(--t-xs)", letterSpacing: "0.06em", color: v ? "var(--gold)" : "var(--ivory-dim)" }}>
                          {PERSONA_FLAVORS[f].name}
                        </span>
                        <span className="footnote num" style={{ color: v ? "var(--gold)" : "var(--ivory-faint)" }}>
                          {v < 0 ? "less" : v > 0 ? "more" : "Default"}
                        </span>
                      </div>
                      <input type="range" min={-1} max={1} step={1} value={v}
                        onChange={(e) => setMod(f, Number(e.target.value))}
                        aria-label={`${PERSONA_FLAVORS[f].name} modulation`}
                        style={{ width: "100%", accentColor: "var(--gold)" }} />
                    </div>
                  );
                })}
              </div>
              <p className="footnote" style={{ marginTop: "var(--s-3)" }}>
                Drag each register left (less) or right (more); center is off. Modulation tunes the
                voice — the complement calibration always wins on conflict.
              </p>
            </div>
          }
        />

        <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-4)", flexWrap: "wrap" }}>
          <CopyAiLink profile={profile} />
        </div>
        <p className="footnote" style={{ marginTop: "var(--s-6)" }}>
          The AI link renders this page from the code alone — share it with a device or
          person who should set up your assistant. Agents can also connect live via the{" "}
          <Link href="/mcp" className="cite" style={{ color: "var(--ivory-dim)" }}>MCP endpoint</Link>.
        </p>
        <p className="footnote" style={{ marginTop: "var(--s-4)" }}>
          Tune how your agent adapts its register to different people — a president vs. a teammate —
          on the{" "}
          <Link href="/comportment" className="cite" style={{ color: "var(--ivory-dim)" }}>comportment page</Link>.
        </p>
      </section>

      <section className="report-section">
        <span className="label gold">My management style for agents</span>
        <p className="prose" style={{ margin: "var(--s-3) 0 var(--s-4)" }}>
          {style.headline} Agents that work with you can refine it: the MCP tool{" "}
          <span className="num">report_collaboration</span> records what worked and what
          didn&apos;t, digested weekly below.
        </p>
        <dl className="ledger">
          {style.sections.map((sec) => (
            <div key={sec.key}>
              <dt>{sec.heading}</dt>
              <dd>
                {sec.entries.map((e, i) => (
                  <p key={i} style={{ margin: i ? "var(--s-3) 0 0" : 0 }}>
                    {e.body}{" "}
                    <span className="footnote num" style={{ whiteSpace: "nowrap" }}>
                      · {e.strength === "strong" ? "strong tendency" : e.strength === "tendency" ? "tendency" : "light"}
                    </span>
                  </p>
                ))}
              </dd>
            </div>
          ))}
        </dl>
        <p className="footnote" style={{ marginTop: "var(--s-4)" }}>
          Strength labels are keyed to percentile extremity — the further a trait sits
          from the median, the harder the tendency.
        </p>
        <div style={{ marginTop: "var(--s-8)" }}>
          <span className="label">Field notes · updated weekly</span>
          <div style={{ marginTop: "var(--s-4)" }}>
            <FieldNotes profile={profile} />
          </div>
        </div>
      </section>
    </>
  );
}
