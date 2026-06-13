"use client";

import { useState } from "react";
import Link from "next/link";
import { buildRelationship } from "@/lib/relationship";
import { profileUrl } from "@/lib/shareview";
import { longDate } from "@/lib/dates";
import type { Profile } from "@/lib/types";

function CopyRelationshipLink({ profile }: { profile: Profile }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn quiet"
      onClick={() => {
        navigator.clipboard?.writeText(profileUrl(profile, location.origin, "/relationship")).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        });
      }}
    >
      {copied ? "Copied" : "Copy share link"}
    </button>
  );
}

// "Relationship with me": a concise, partner-facing one-pager for a romantic
// context, rendered as a face of the profile page.
export function RelationshipSheet({ profile, showBack = false }: { profile: Profile; showBack?: boolean }) {
  const sections = buildRelationship(profile);
  return (
    <>
      <div className="print-only print-head">
        <span className="label gold">Relationship with me — Prismona</span>
        <span className="num" style={{ fontSize: "var(--t-sm)", color: "var(--ivory-faint)" }}>
          {longDate(profile.date)} · prismona.vercel.app
        </span>
      </div>

      <section className="arch-display">
        <p className="label gold">Concise manual for partner</p>
        <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "12px 0 16px" }}>
          Relationship with me
        </h1>
        <p className="prose">
          Generated from my {profile.tier} personality blueprint on {longDate(profile.date)} —
          how I show love, handle conflict, and what I need to feel close. The strongest
          finding in couples research is that how partners treat each other predicts more
          than either one&apos;s traits, so treat this as my honest opening bid, not a forecast.
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
          Partner-effect evidence draws on Malouff et al. (2010), Dyrenforth et al. (2010),
          and Joel et al. (2020); the full base is on the{" "}
          <Link href="/methodology" className="cite" style={{ color: "var(--ivory-dim)" }}>Methodology page</Link>.
          Personality describes tendencies at modest effect sizes — update this with what
          your relationship actually shows.
        </p>
        <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-8)", flexWrap: "wrap" }}>
          <button className="btn" onClick={() => window.print()}>Save as PDF</button>
          <CopyRelationshipLink profile={profile} />
          {showBack && <Link href="/blueprint" className="btn quiet">Back to blueprint</Link>}
        </div>
      </section>
    </>
  );
}
