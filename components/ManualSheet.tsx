"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildManual } from "@/lib/manual";
import { loadValues } from "@/lib/storage";
import type { ValuesProfile } from "@/lib/values";
import { profileUrl } from "@/lib/shareview";
import { longDate } from "@/lib/dates";
import type { Profile } from "@/lib/types";

function CopyManualLink({ profile }: { profile: Profile }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn quiet"
      onClick={() => {
        navigator.clipboard?.writeText(profileUrl(profile, location.origin, "/manual")).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        });
      }}
    >
      {copied ? "Copied" : "Copy share link"}
    </button>
  );
}

// The working-with-me one-pager, renderable standalone (/manual) or as the
// second face of the profile page.
export function ManualSheet({ profile, showBack = true }: { profile: Profile; showBack?: boolean }) {
  const [values, setValues] = useState<ValuesProfile | null>(null);
  useEffect(() => { setValues(loadValues()?.profile ?? null); }, []);
  const sections = buildManual(profile, values);
  return (
    <>
      <div className="print-only print-head">
        <span className="label gold">Working with me — Prismona</span>
        <span className="num" style={{ fontSize: "var(--t-sm)", color: "var(--ivory-faint)" }}>
          {longDate(profile.date)} · prismona.vercel.app
        </span>
      </div>

      <section className="arch-display">
        <p className="label gold">Concise manual for coworkers</p>
        <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "12px 0 16px" }}>
          Working with me
        </h1>
        <p className="prose">
          Generated from my {profile.tier} personality
          blueprint on {longDate(profile.date)} — how I communicate, decide, take
          feedback, and what you can count on. Self-report is one side of the story;
          treat this as my honest opening bid, not a contract.
        </p>
      </section>

      {sections.map((s) => (
        <section className="report-section" key={s.key}>
          <span className="label gold">{s.heading}</span>
          <dl className="ledger" style={{ marginTop: "var(--s-3)" }}>
            {s.entries.map((e) => (
              <div key={e.title}>
                <dt>{e.title}</dt>
                <dd>{e.body}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <section className="report-section">
        <p className="footnote" style={{ maxWidth: "72ch" }}>
          Trait–workplace links draw on Barrick &amp; Mount (1991), Judge et al. (2002),
          and Bell (2007); the full evidence base is on the{" "}
          <Link href="/methodology" className="cite" style={{ color: "var(--ivory-dim)" }}>Methodology page</Link>.
          Personality describes tendencies at modest effect sizes — update this manual
          with what colleagues actually observe.
        </p>
        <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-8)", flexWrap: "wrap" }}>
          <button className="btn" onClick={() => window.print()}>Save as PDF</button>
          <CopyManualLink profile={profile} />
          {showBack && <Link href="/blueprint" className="btn quiet">Back to blueprint</Link>}
        </div>
      </section>
    </>
  );
}
