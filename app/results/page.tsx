"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { archetypeByName, trustNote } from "@/lib/archetypes";
import { buildInsights } from "@/lib/insights";
import { encodeShareCode } from "@/lib/codec";
import { TRAIT_LABELS } from "@/lib/norms";
import { loadLatest, loadProfile } from "@/lib/storage";
import { BandBar } from "@/components/BandBar";
import type { Profile, ReportKey } from "@/lib/types";

const TRAIT_ORDER: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];
const FACET_DOMAIN_ORDER: ReportKey[] = ["O", "C", "E", "A", "ES", "H"];

function EmptyState() {
  return (
    <main className="shell" style={{ padding: "var(--s-24) 0" }}>
      <p className="label gold">Your profile</p>
      <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "16px 0 24px", maxWidth: "18ch" }}>
        Nothing measured yet.
      </h1>
      <p className="prose">
        Your profile is produced by the assessment and lives only in this browser —
        we could not show you someone else&apos;s results if we wanted to. Five minutes
        of first instincts is all the Quick Profile asks.
      </p>
      <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-12)", flexWrap: "wrap" }}>
        <Link href="/assess?tier=quick" className="btn solid">Begin · 5 minutes</Link>
        <Link href="/assess?tier=full" className="btn">Full Index · 126 items</Link>
      </div>
    </main>
  );
}

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="share-code">
      <span className="num">{code}</span>
      <button
        className="btn quiet"
        style={{ padding: "8px 18px" }}
        onClick={() => {
          navigator.clipboard?.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          });
        }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function Report({ profile }: { profile: Profile }) {
  const top = archetypeByName(profile.archetypes[0]?.name);
  const insights = buildInsights(profile);
  const code = encodeShareCode(profile);
  const q = profile.quality;
  const cleanPace = q.fast <= 3 && q.timeouts <= 2 && !q.straight;

  return (
    <main className="shell reveal">
      {/* I — archetype */}
      <section className="arch-display">
        <p className="label gold num">
          {profile.tier === "full" ? "Full Index" : "Quick Profile"} · {profile.date} ·
          primary archetype
        </p>
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
        <p className="footnote" style={{ marginTop: "var(--s-6)" }}>
          You are the percentages, not the label: archetypes narrate your dimensional
          scores below, never replace them (Gerlach et al., 2018).
        </p>
      </section>

      {/* II — dimensions */}
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
          Percentiles vs. provisional adult norms; the shaded band is ±1 standard error —
          your true standing most plausibly lies inside it. Norms are re-estimated as our
          sample grows.
        </p>
      </section>

      {/* III — facets (full tier) */}
      {profile.facets.length > 0 && (
        <section className="report-section">
          <span className="label"><span className="roman" style={{ fontSize: "1em" }}>III</span> &nbsp;·&nbsp; Thirty facets</span>
          <div className="facet-grid">
            {FACET_DOMAIN_ORDER.map((d) => {
              const fs = profile.facets.filter((f) => f.domain === d);
              if (!fs.length) return null;
              return (
                <div className="facet-domain" key={d}>
                  <span className="label">{TRAIT_LABELS[d]}</span>
                  {fs.map((f) => (
                    <BandBar key={f.name} name={f.name} pct={f.pct} lo={f.lo} hi={f.hi} />
                  ))}
                </div>
              );
            })}
          </div>
          <p className="footnote" style={{ marginTop: "var(--s-4)" }}>
            Facets are four-item scales — wider bands, by honesty. Stability facets are
            reported in the Emotional Stability direction; original IPIP scale names are
            on the <Link href="/method" className="cite" style={{ color: "var(--ivory-dim)" }}>Method page</Link>.
          </p>
        </section>
      )}

      {/* IV — distillation */}
      {top && (
        <section className="report-section">
          <span className="label"><span className="roman" style={{ fontSize: "1em" }}>{profile.facets.length ? "IV" : "III"}</span> &nbsp;·&nbsp; Distillation</span>
          <dl className="ledger">
            <div><dt>How you think</dt><dd>{top.think}</dd></div>
            <div><dt>How you act</dt><dd>{top.act}</dd></div>
            <div><dt>What you value</dt><dd>{top.value}</dd></div>
            <div><dt>How you solve</dt><dd>{top.solve}</dd></div>
            <div><dt>Blind spots</dt><dd>{top.blind}</dd></div>
            <div><dt>Trust profile</dt><dd>{trustNote(profile.traits.H.pct)}</dd></div>
          </dl>
        </section>
      )}

      {/* V — applied readings */}
      <section className="report-section">
        <span className="label"><span className="roman" style={{ fontSize: "1em" }}>{profile.facets.length ? "V" : "IV"}</span> &nbsp;·&nbsp; Applied readings</span>
        <p className="prose" style={{ margin: "var(--s-4) 0 var(--s-10)" }}>
          Six readings of the same six scores — generated from your actual percentiles,
          not your archetype label. Each carries its evidence inline and states its limits.
        </p>
        {insights.map((s) => (
          <div key={s.key} style={{ marginBottom: "var(--s-12)" }}>
            <span className="label gold">{s.heading}</span>
            <dl className="ledger" style={{ marginTop: "var(--s-3)" }}>
              {s.insights.map((i) => (
                <div key={i.title}>
                  <dt>{i.title}</dt>
                  <dd>
                    {i.body}{" "}
                    <span className="cite" style={{ color: "var(--ivory-dim)" }}>({i.cite})</span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="footnote" style={{ marginTop: "var(--s-3)" }}>{s.caveat}</p>
          </div>
        ))}
        <p className="prose" style={{ margin: "var(--s-8) 0 var(--s-4)" }}>
          For a pairing read against the evidence — not notes, but your two actual
          profiles — exchange share codes. Yours encodes six trait scores and nothing
          else: no answers, no identity.
        </p>
        <CopyCode code={code} />
        <div style={{ marginTop: "var(--s-6)" }}>
          <Link href="/compare" className="btn">Compare with someone</Link>
        </div>
      </section>

      {/* VI — confidence */}
      <section className="report-section">
        <span className="label"><span className="roman" style={{ fontSize: "1em" }}>{profile.facets.length ? "VI" : "V"}</span> &nbsp;·&nbsp; Profile confidence</span>
        <div className="flags">
          <span className="flag num">{q.answered}/{q.total} answered</span>
          <span className="flag num">median response {(q.medLat / 1000).toFixed(1)}s</span>
          <span className="flag num">consistency {q.consistency}/100</span>
          {q.fast > 3
            ? <span className="flag warn num">{q.fast} very fast responses — possible carelessness</span>
            : <span className="flag ok">pace looks considered</span>}
          {q.timeouts > 2 && <span className="flag warn num">{q.timeouts} timeouts — scores less precise</span>}
          {q.straight && <span className="flag warn">long identical-answer streak — possible straight-lining</span>}
          {cleanPace && q.consistency >= 60 && <span className="flag ok">profile confidence: good</span>}
        </div>
        <p className="footnote" style={{ marginTop: "var(--s-4)" }}>
          Consistency is a person-fit heuristic: how coherently you answered items
          measuring the same construct (Meade &amp; Craig, 2012).
        </p>
      </section>

      {/* read this */}
      <section className="report-section">
        <p className="footnote" style={{ maxWidth: "72ch" }}>
          <strong style={{ color: "var(--ivory)" }}>Read this before acting on results.</strong>{" "}
          This {profile.tier === "full" ? "instrument estimates traits with good precision (126 items), yet personality" : "short screening estimates broad traits with real but limited precision (26 items). Personality"}{" "}
          predicts life outcomes at modest effect sizes (r ≈ .2–.3 for the strongest links).
          Use this profile to structure better conversations and decisions — never as a
          verdict on yourself or anyone else. Full evidence on the{" "}
          <Link href="/method" className="cite" style={{ color: "var(--ivory-dim)" }}>Method page</Link>.
        </p>
        <div style={{ display: "flex", gap: "var(--s-3)", marginTop: "var(--s-8)", flexWrap: "wrap" }}>
          {profile.tier === "quick"
            ? <Link href="/assess?tier=full" className="btn">Take the Full Index</Link>
            : <Link href="/assess?tier=quick" className="btn quiet">Retake Quick Profile</Link>}
          <Link href={`/assess?tier=${profile.tier}`} className="btn quiet">Retake</Link>
        </div>
      </section>
    </main>
  );
}

function ResultsInner() {
  const params = useSearchParams();
  const tierParam = params.get("tier");
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);

  useEffect(() => {
    const p = tierParam === "full" || tierParam === "quick" ? loadProfile(tierParam) ?? loadLatest() : loadLatest();
    setProfile(p);
  }, [tierParam]);

  if (profile === undefined) return null; // first paint, before storage read
  if (profile === null) return <EmptyState />;
  return <Report profile={profile} />;
}

export default function ResultsPage() {
  return (
    <Suspense fallback={null}>
      <ResultsInner />
    </Suspense>
  );
}
