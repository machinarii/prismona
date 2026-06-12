"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { developmentPlan, discrepancyReport, growthAddendum, type DesiredSelf } from "@/lib/aspire";
import { loadDesired, saveDesired } from "@/lib/storage";
import { TRAIT_LABELS } from "@/lib/norms";
import { longDate } from "@/lib/dates";
import { BandBar } from "@/components/BandBar";
import type { Profile, ReportKey } from "@/lib/types";

const KEYS: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];

function Sliders({ profile, initial, onSave }: {
  profile: Profile;
  initial: Record<ReportKey, number> | null;
  onSave: (targets: Record<ReportKey, number>) => void;
}) {
  const [targets, setTargets] = useState<Record<ReportKey, number>>(
    initial ?? (Object.fromEntries(KEYS.map((k) => [k, profile.traits[k].pct])) as Record<ReportKey, number>),
  );
  return (
    <div style={{ margin: "var(--s-8) 0" }}>
      <p className="footnote" style={{ marginBottom: "var(--s-4)" }}>
        Each slider starts at where you measure today. Move it to where you want to be —
        leaving it alone is a valid answer; wanting to be exactly who you are is called
        congruence, and it&apos;s the good outcome.
      </p>
      {KEYS.map((k) => (
        <div className="band-row" key={k}>
          <span className="name">
            {TRAIT_LABELS[k]}
            <br /><span className="footnote num">now {profile.traits[k].pct}</span>
          </span>
          <input
            type="range" min={1} max={99} value={targets[k]}
            aria-label={`Desired ${TRAIT_LABELS[k]}`}
            onChange={(e) => setTargets({ ...targets, [k]: Number(e.target.value) })}
            style={{ width: "100%", accentColor: "var(--gold)" }}
          />
          <span className="val num">{targets[k]}</span>
        </div>
      ))}
      <div style={{ marginTop: "var(--s-6)" }}>
        <button className="btn solid" onClick={() => onSave(targets)}>Set my desired self</button>
      </div>
    </div>
  );
}

function CopyAddendum({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <details open style={{ marginTop: "var(--s-6)" }}>
      <summary className="btn quiet" style={{ listStyle: "none", cursor: "pointer", display: "inline-block" }}>
        Growth addendum for your AI
      </summary>
      <pre className="footnote num" style={{
        whiteSpace: "pre-wrap", border: "1px dashed var(--hairline)",
        padding: "var(--s-4) var(--s-6)", margin: "var(--s-4) 0", letterSpacing: 0,
      }}>{text}</pre>
      <button
        className="btn quiet"
        onClick={() => {
          navigator.clipboard?.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          });
        }}
      >
        {copied ? "Copied" : "Copy growth addendum"}
      </button>
    </details>
  );
}

// The fourth face of the profile: desired self vs. measured self, treated as
// self-development with the volitional-change evidence behind it.
export function BecomingSheet({ profile }: { profile: Profile }) {
  const [desired, setDesired] = useState<DesiredSelf | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);

  useEffect(() => { setDesired(loadDesired()); }, []);
  if (desired === undefined) return null;

  const save = (targets: Record<ReportKey, number>) => {
    const d: DesiredSelf = { v: 1, date: new Date().toISOString().slice(0, 10), targets };
    saveDesired(d);
    setDesired(d);
    setEditing(false);
  };

  const report = desired && !editing ? discrepancyReport(profile, desired.targets) : null;

  return (
    <>
      <section className="arch-display">
        <p className="label gold">Becoming</p>
        <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "12px 0 16px", maxWidth: "16ch" }}>
          Who do you want to be?
        </h1>
        <p className="prose">
          Your report measures who you are. This page holds who you&apos;re aiming to
          be — and the gap between the two is not a flaw, it&apos;s the agenda. The
          distance between your actual and your desired self shapes how you feel; most
          people hold trait change goals; and the goals work when tied to small weekly
          behaviors rather than intention.
        </p>
        <p className="footnote" style={{ marginTop: "var(--s-4)" }}>
          Self-discrepancy: Higgins (1987) · possible selves: Markus &amp; Nurius (1986) ·
          volitional trait change: Hudson &amp; Fraley (2015). Full references on the{" "}
          <Link href="/method" className="cite" style={{ color: "var(--ivory-dim)" }}>Methodology page</Link>.
        </p>
      </section>

      {(!desired || editing) && (
        <section className="report-section">
          <span className="label gold">Your desired self · six dials</span>
          <Sliders profile={profile} initial={editing && desired ? desired.targets : null} onSave={save} />
        </section>
      )}

      {report && desired && (
        <>
          <section className="report-section">
            <span className="label gold num">Actual → desired · set {longDate(desired.date)}</span>
            <div style={{ marginTop: "var(--s-4)" }}>
              {KEYS.map((k) => {
                const d = report.perTrait[k];
                return (
                  <div key={k}>
                    <BandBar name={TRAIT_LABELS[k]} pct={d.actual} lo={d.actual} hi={d.actual} />
                    <p className="footnote num" style={{ margin: "0 0 var(--s-3)" }}>
                      {d.congruent
                        ? `desired ${d.desired} — within the measurement band: congruent`
                        : `desired ${d.desired} · ${d.direction === "up" ? "▲ grow" : "▼ ease"} ${d.gap} points`}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="prose" style={{ marginTop: "var(--s-4)" }}>{report.note}</p>
          </section>

          {report.focus && (
            <section className="report-section">
              <span className="label gold">This season&apos;s focus · {TRAIT_LABELS[report.focus]}</span>
              {(() => {
                const plan = developmentPlan(report.focus!, report.focusDirection);
                return (
                  <>
                    <p className="prose" style={{ margin: "var(--s-3) 0" }}><strong>{plan.goal}.</strong> {plan.why}</p>
                    <dl className="ledger">
                      {plan.weekly.map((w, i) => (
                        <div key={i}><dt>Practice {i + 1}</dt><dd>{w}</dd></div>
                      ))}
                    </dl>
                    <CopyAddendum text={growthAddendum(report)} />
                  </>
                );
              })()}
            </section>
          )}

          <section className="report-section">
            <p className="footnote" style={{ maxWidth: "72ch" }}>
              Progress is measured against your retest trajectory — take the assessment
              again in a few months and the Trajectory block reports real movement, in
              your own SEM bands. The desired self lives only in this browser.
            </p>
            <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-6)", flexWrap: "wrap" }}>
              <button className="btn quiet" onClick={() => setEditing(true)}>Adjust desired self</button>
              <button className="btn quiet" onClick={() => { saveDesired(null); setDesired(null); }}>Clear</button>
            </div>
          </section>
        </>
      )}
    </>
  );
}
