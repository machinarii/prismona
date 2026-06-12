"use client";

import { useEffect, useState } from "react";
import { interactionGuide } from "@/lib/persona";
import { longDate } from "@/lib/dates";
import Link from "next/link";
import { archetypeByName, trustNote } from "@/lib/archetypes";
import { buildInsights } from "@/lib/insights";
import { decodeShareCode, encodeShareCode } from "@/lib/codec";
import { profileFromShare } from "@/lib/shareview";
import { TRAIT_LABELS } from "@/lib/norms";
import { BandBar } from "@/components/BandBar";
import { RarityLine } from "@/components/RarityLine";
import { TraitFigure } from "@/components/TraitFigure";
import { CitationList, CiteMarks } from "@/components/Citations";
import { buildCitationIndex } from "@/lib/citations";
import type { Profile, ReportKey } from "@/lib/types";

const TRAIT_ORDER: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];

function Invalid() {
  return (
    <main className="shell" style={{ padding: "var(--s-24) 0" }}>
      <p className="label gold">Shared profile</p>
      <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "16px 0 24px", maxWidth: "20ch" }}>
        This link carries no readable profile.
      </h1>
      <p className="prose">
        A profile link looks like <span className="num">prismona.vercel.app/p#PRSM-…</span> —
        the code after the <span className="num">#</span> is the entire payload: six trait
        scores, a date, a consistency index. Nothing is stored on a server, so a truncated
        or mistyped link cannot be recovered. Ask for the link again, or paste the code
        directly on the <Link href="/compare" className="cite">compare page</Link>.
      </p>
      <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-12)", flexWrap: "wrap" }}>
        <Link href="/assess?tier=quick" className="btn solid">Measure yourself instead</Link>
      </div>
    </main>
  );
}

function CopyGuide({ profile }: { profile: Profile }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn quiet"
      onClick={() => {
        navigator.clipboard?.writeText(interactionGuide(profile)).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        });
      }}
    >
      {copied ? "Copied" : "Copy interaction guide"}
    </button>
  );
}

function SharedReport({ profile }: { profile: Profile }) {
  const top = archetypeByName(profile.archetypes[0]?.name);
  const insights = buildInsights(profile);
  const citations = buildCitationIndex(insights.flatMap((s) => s.insights.map((i) => i.cite)));
  return (
    <main className="shell reveal">
      <div className="print-only print-head">
        <span className="label gold">Prismona — Shared Profile</span>
        <span className="num" style={{ fontSize: "var(--t-sm)", color: "var(--ivory-faint)" }}>
          {profile.tier === "full" ? "Full Index" : "Quick Profile"} · {longDate(profile.date)} · prismona.vercel.app
        </span>
      </div>

      <section className="arch-display">
        <p className="label gold num">
          Shared profile · {profile.tier === "full" ? "Full Index" : "Quick Profile"} · {longDate(profile.date)}
        </p>
        <div className="arch-figure-row">
          <div>
            <h1 className="arch-name display">{top?.name ?? "—"}</h1>
            <p className="arch-tag">{top?.tag}</p>
            <div className="blend">
              {profile.archetypes.slice(0, 3).map((a) => (
                <div key={a.name}>
                  <div className="pctnum num">{a.match}%</div>
                  <div className="pctname">{a.name}</div>
                </div>
              ))}
            </div>
          </div>
          <TraitFigure profile={profile} />
        </div>
        <RarityLine profile={profile} topName={top?.name} />
        <p className="footnote" style={{ marginTop: "var(--s-6)" }}>
          Rendered entirely from the code in this link: six trait scores, nothing else —
          no name, no answers, no facets. The person who sent it controls every copy.
        </p>
      </section>

      <section className="report-section">
        <span className="label"><span className="roman" style={{ fontSize: "1em" }}>II</span> &nbsp;·&nbsp; Trait profile</span>
        <div>
          {TRAIT_ORDER.map((k) => (
            <BandBar
              key={k}
              name={TRAIT_LABELS[k]}
              pct={profile.traits[k].pct}
              lo={profile.traits[k].lo}
              hi={profile.traits[k].hi}
            />
          ))}
        </div>
        <p className="footnote" style={{ marginTop: "var(--s-4)" }}>
          Percentiles vs. provisional adult norms; shaded band is ±1 standard error,
          reconstructed from this edition&apos;s reliability. Consistency at measurement:{" "}
          <span className="num">{profile.quality.consistency}/100</span>.
        </p>
      </section>

      {top && (
        <section className="report-section">
          <span className="label"><span className="roman" style={{ fontSize: "1em" }}>III</span> &nbsp;·&nbsp; Distillation</span>
          <dl className="ledger">
            <div><dt>How they think</dt><dd>{top.think}</dd></div>
            <div><dt>How they act</dt><dd>{top.act}</dd></div>
            <div><dt>What they value</dt><dd>{top.value}</dd></div>
            <div><dt>How they solve</dt><dd>{top.solve}</dd></div>
            <div><dt>Blind spots</dt><dd>{top.blind}</dd></div>
            <div><dt>Trust profile</dt><dd>{trustNote(profile.traits.H.pct)}</dd></div>
          </dl>
        </section>
      )}

      <section className="report-section">
        <span className="label"><span className="roman" style={{ fontSize: "1em" }}>IV</span> &nbsp;·&nbsp; Applied readings</span>
        <p className="prose" style={{ margin: "var(--s-4) 0 var(--s-10)" }}>
          The same six readings their owner sees — generated from these scores. Written
          in the second person; read it as addressed to them.
        </p>
        {insights.map((s) => (
          <div key={s.key} style={{ marginBottom: "var(--s-12)" }}>
            <span className="label gold">{s.heading}</span>
            <dl className="ledger" style={{ marginTop: "var(--s-3)" }}>
              {s.insights.map((i) => (
                <div key={i.title}>
                  <dt>{i.title}</dt>
                  <dd>
                    {i.body}
                    <CiteMarks nums={citations.numbersFor(i.cite)} />
                  </dd>
                </div>
              ))}
            </dl>
            <p className="footnote" style={{ marginTop: "var(--s-3)" }}>{s.caveat}</p>
          </div>
        ))}
      </section>

      <section className="report-section">
        <div className="no-print" style={{ marginBottom: "var(--s-10)" }}>
          <span className="label gold">Interacting with this person?</span>
          <p className="prose" style={{ margin: "var(--s-3) 0 var(--s-4)" }}>
            This profile is a consented digital ID. Copy the interaction guide below
            into your own AI assistant — or read it yourself — to communicate with
            them the way their measured profile suggests works best.
          </p>
          <CopyGuide profile={profile} />
        </div>
        <p className="prose">
          Curious how you two pair? Take the assessment, then compare your code with
          this one — the dyad report scores the pairing for romance, cofounding, or
          working together.
        </p>
        <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-8)", flexWrap: "wrap" }}>
          <Link href="/assess?tier=quick" className="btn solid">Measure yourself · 5 minutes</Link>
          <Link href="/compare" className="btn">Compare with this profile</Link>
          <Link href={`/manual#${encodeShareCode(profile)}`} className="btn quiet">Their working-with-me manual</Link>
          <Link href={`/predict#${encodeShareCode(profile)}`} className="btn quiet">Test how well you see them</Link>
          <button className="btn quiet" onClick={() => window.print()}>Save as PDF</button>
        </div>
      </section>

      <CitationList refs={citations.refs} />
    </main>
  );
}

export default function SharedProfilePage() {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    const fromHash = location.hash.slice(1);
    const fromQuery = new URLSearchParams(location.search).get("code") ?? "";
    const code = fromHash || fromQuery;
    const share = code ? decodeShareCode(decodeURIComponent(code)) : null;
    setProfile(share ? profileFromShare(share) : null);
  }, []);

  if (profile === undefined) return null;
  if (profile === null) return <Invalid />;
  return <SharedReport profile={profile} />;
}
