"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildManual } from "@/lib/manual";
import { loadLatest } from "@/lib/storage";
import type { Profile } from "@/lib/types";

function EmptyState() {
  return (
    <main className="shell" style={{ padding: "var(--s-24) 0" }}>
      <p className="label gold">Working with me</p>
      <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "16px 0 24px", maxWidth: "18ch" }}>
        No profile to write from.
      </h1>
      <p className="prose">
        The manual is generated from your measured profile. Take the assessment
        first — five minutes of first instincts is all the Quick Profile asks.
      </p>
      <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-12)", flexWrap: "wrap" }}>
        <Link href="/assess?tier=quick" className="btn solid">Begin · 5 minutes</Link>
      </div>
    </main>
  );
}

function Manual({ profile }: { profile: Profile }) {
  const sections = buildManual(profile);
  return (
    <main className="shell reveal">
      <div className="print-only print-head">
        <span className="label gold">Working with me — Prismona</span>
        <span className="num" style={{ fontSize: "var(--t-sm)", color: "var(--ivory-faint)" }}>
          {profile.date} · prismona.vercel.app
        </span>
      </div>

      <section className="arch-display">
        <p className="label gold">A one-page manual, measured</p>
        <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "12px 0 16px" }}>
          Working with me
        </h1>
        <p className="prose">
          Generated from my assessed personality profile ({profile.tier === "full" ? "Full Index" : "Quick Profile"},
          {" "}{profile.date}) — how I communicate, decide, take feedback, and what you can
          count on. Self-report is one side of the story; treat this as my honest opening
          bid, not a contract.
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
          <Link href="/method" className="cite" style={{ color: "var(--ivory-dim)" }}>Method page</Link>.
          Personality describes tendencies at modest effect sizes — update this manual
          with what colleagues actually observe.
        </p>
        <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-8)", flexWrap: "wrap" }}>
          <button className="btn" onClick={() => window.print()}>Save as PDF</button>
          <Link href="/results" className="btn quiet">Back to profile</Link>
        </div>
      </section>
    </main>
  );
}

export default function ManualPage() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  useEffect(() => { setProfile(loadLatest()); }, []);
  if (profile === undefined) return null;
  if (profile === null) return <EmptyState />;
  return <Manual profile={profile} />;
}
