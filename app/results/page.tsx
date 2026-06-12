"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { archetypeByName, trustNote } from "@/lib/archetypes";
import { buildInsights } from "@/lib/insights";
import { aiContextBlock } from "@/lib/portable";
import { agentPersona } from "@/lib/persona";
import { buildProfileExport } from "@/lib/export";
import { INTERESTS_CITE, interestsCareerNote, type InterestProfile, type RiasecKey } from "@/lib/interests";
import { RIASEC_LABELS } from "@/lib/data/riasec";
import { decodeShareCode, encodeShareCode } from "@/lib/codec";
import { profileUrl, sameShareCode } from "@/lib/shareview";
import { RarityLine } from "@/components/RarityLine";
import { TraitFigure } from "@/components/TraitFigure";
import { Contribute } from "@/components/Contribute";
import { ObserverLens } from "@/components/ObserverLens";
import { ManualSheet } from "@/components/ManualSheet";
import { CitationList, CiteMarks } from "@/components/Citations";
import { buildCitationIndex } from "@/lib/citations";
import { TRAIT_LABELS } from "@/lib/norms";
import { loadHistory, loadInterests, loadLatest, loadProfile } from "@/lib/storage";
import { traitDrift, type DriftReport } from "@/lib/timeline";
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

function CopyCode({ code, profile }: { code: string; profile: Profile }) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const copy = (text: string, kind: "code" | "link") => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    });
  };
  return (
    <div className="share-code">
      <span className="num">{code}</span>
      <button
        className="btn quiet"
        style={{ padding: "8px 18px" }}
        onClick={() => copy(code, "code")}
      >
        {copied === "code" ? "Copied" : "Copy code"}
      </button>
      <button
        className="btn quiet"
        style={{ padding: "8px 18px" }}
        onClick={() => copy(profileUrl(profile, location.origin), "link")}
      >
        {copied === "link" ? "Copied" : "Copy profile link"}
      </button>
    </div>
  );
}

function CopyBlock({ summary, action, text }: { summary: string; action: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <details style={{ marginBottom: "var(--s-4)" }}>
      <summary className="btn quiet" style={{ listStyle: "none", cursor: "pointer", display: "inline-block" }}>
        {summary}
      </summary>
      <pre
        className="footnote num"
        style={{
          whiteSpace: "pre-wrap", border: "1px dashed var(--hairline)",
          padding: "var(--s-4) var(--s-6)", margin: "var(--s-4) 0", letterSpacing: 0,
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
    </details>
  );
}

function InterestsBlock({ interests }: { interests: InterestProfile | null }) {
  if (!interests) {
    return (
      <p className="footnote no-print" style={{ marginTop: "var(--s-8)" }}>
        Traits say how you travel; interests say which direction. The five-minute{" "}
        <Link href="/interests" className="cite" style={{ color: "var(--ivory-dim)" }}>interest inventory</Link>{" "}
        adds your Holland code here and sharpens the career reading below.
      </p>
    );
  }
  const ranked = (["R", "I", "A", "S", "E", "C"] as RiasecKey[])
    .sort((a, b) => interests.scores[b].mean - interests.scores[a].mean);
  return (
    <div className="interests-plate">
      <span className="label gold num">Vocational interests · {interests.date}</span>
      <div className="ip-code num">{interests.code}</div>
      <p className="ip-names">
        {interests.top.map((k) => RIASEC_LABELS[k].name).join(" · ")} — which work you
        keep choosing; the traits above estimate how you&apos;ll travel it.
      </p>
      <div style={{ marginTop: "var(--s-4)" }}>
        {ranked.map((k) => {
          const mean = interests.scores[k].mean;
          return (
            <div className="band-row" key={k}>
              <span className="name">{RIASEC_LABELS[k].name} — {RIASEC_LABELS[k].gloss}</span>
              <div className="band-track" role="img" aria-label={`${RIASEC_LABELS[k].name}: ${mean.toFixed(1)} of 5`}>
                <span className="band" style={{ left: 0, width: `${((mean - 1) / 4) * 100}%` }} />
              </div>
              <span className="val num">{mean.toFixed(1)}</span>
            </div>
          );
        })}
      </div>
      <p className="footnote" style={{ marginTop: "var(--s-3)" }}>
        Scales are ranked against each other (ipsative; O*NET Mini-IP) — the ordering is
        the result.{" "}
        <Link href="/interests?retake=1" className="cite" style={{ color: "var(--ivory-dim)" }}>Retake</Link>
      </p>
    </div>
  );
}

function Report({ profile, drift, interests }: {
  profile: Profile; drift: DriftReport | null; interests: InterestProfile | null;
}) {
  const top = archetypeByName(profile.archetypes[0]?.name);
  const insights = buildInsights(profile);
  const citations = buildCitationIndex(
    insights.flatMap((s) => [
      ...s.insights.map((i) => i.cite),
      ...(s.key === "career" && interests ? [INTERESTS_CITE] : []),
    ]),
  );
  const code = encodeShareCode(profile);
  const q = profile.quality;
  const cleanPace = q.fast <= 3 && q.timeouts <= 2 && !q.straight;

  return (
    <main className="shell reveal">
      {/* print-only document header */}
      <div className="print-only print-head">
        <span className="label gold">Prismona — Personality Profile</span>
        <span className="num" style={{ fontSize: "var(--t-sm)", color: "var(--ivory-faint)" }}>
          {profile.tier === "full" ? "Full Index" : "Quick Profile"} · {profile.date} · prismona.vercel.app
        </span>
      </div>

      {/* I — archetype */}
      <section className="arch-display">
        <p className="label gold num">
          {profile.tier === "full" ? "Full Index" : "Quick Profile"} · {profile.date} ·
          primary archetype
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
        {drift && (
          <div style={{ marginTop: "var(--s-8)" }}>
            <span className="label gold num">
              Trajectory · {drift.n} measurements · {drift.from} → {drift.to}
            </span>
            <div className="flags" style={{ marginTop: "var(--s-4)" }}>
              {TRAIT_ORDER.map((k) => {
                const d = drift.traits[k];
                return d.shifted ? (
                  <span key={k} className="flag num">
                    {TRAIT_LABELS[k]} {d.from} → {d.to} — moved beyond the error band
                  </span>
                ) : null;
              })}
              {drift.stable && <span className="flag ok">all six traits stable within their error bands</span>}
            </div>
            <p className="footnote" style={{ marginTop: "var(--s-4)" }}>
              Personality does change — slowly (Roberts et al., 2007). We report movement
              only when your first and latest ±1 SEM bands fail to overlap; everything
              inside the bands is measurement noise, honestly labeled.
            </p>
          </div>
        )}
        <InterestsBlock interests={interests} />
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
                    {i.body}
                    <CiteMarks nums={citations.numbersFor(i.cite)} />
                  </dd>
                </div>
              ))}
              {s.key === "career" && interests && (
                <div>
                  <dt>Interests × traits</dt>
                  <dd>
                    {interestsCareerNote(interests, profile)}
                    <CiteMarks nums={citations.numbersFor(INTERESTS_CITE)} />
                  </dd>
                </div>
              )}
            </dl>
            <p className="footnote" style={{ marginTop: "var(--s-3)" }}>{s.caveat}</p>
          </div>
        ))}
        <p className="prose" style={{ margin: "var(--s-8) 0 var(--s-4)" }}>
          For a pairing read against the evidence — not notes, but your two actual
          profiles — exchange share codes. Yours encodes six trait scores and nothing
          else: no answers, no identity. The profile link is the same code carried in
          a URL fragment, which browsers never transmit — even we couldn&apos;t log it.
        </p>
        <CopyCode code={code} profile={profile} />
        <div style={{ marginTop: "var(--s-6)" }}>
          <Link href="/compare" className="btn">Compare with someone</Link>
        </div>

        <div className="no-print" style={{ marginTop: "var(--s-12)" }}>
          <span className="label gold">Take your profile to your AI</span>
          <p className="prose" style={{ margin: "var(--s-3) 0 var(--s-4)" }}>
            Two plain-text blocks to paste into Claude, ChatGPT, or any assistant.
            The <em>context</em> makes an AI adapt to how you think; the{" "}
            <em>companion persona</em> goes further — it calibrates an AI to be your
            complement, supplying the structure, calm, or candor your profile suggests
            you benefit from. You copy them; nothing is sent.
          </p>
          <CopyBlock summary="Preview AI context" action="Copy AI context" text={aiContextBlock(profile)} />
          <CopyBlock summary="Preview companion persona" action="Copy companion persona" text={agentPersona(profile)} />
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
        <ObserverLens profile={profile} />
        <Contribute profile={profile} />
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
          <button className="btn quiet" onClick={() => window.print()}>Save as PDF</button>
          <button
            className="btn quiet"
            onClick={() => {
              const blob = new Blob(
                [JSON.stringify(buildProfileExport(profile, interests), null, 2)],
                { type: "application/json" },
              );
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `prismona-profile-${profile.date}.json`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            Download JSON
          </button>
        </div>
      </section>

      <CitationList refs={citations.refs} />
    </main>
  );
}

function ResultsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const tierParam = params.get("tier");
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [drift, setDrift] = useState<DriftReport | null>(null);
  const [interests, setInterests] = useState<InterestProfile | null>(null);

  useEffect(() => {
    const p = tierParam === "full" || tierParam === "quick" ? loadProfile(tierParam) ?? loadLatest() : loadLatest();
    // A code in the URL that isn't this browser's profile is someone else's
    // link — hand it to the shared-profile view rather than ignoring it.
    const hash = location.hash.slice(1);
    if (hash && decodeShareCode(hash) && (!p || !sameShareCode(hash, p))) {
      router.replace(`/p#${hash}`);
      return;
    }
    setProfile(p);
    setDrift(traitDrift(loadHistory()));
    setInterests(loadInterests());
    // Keep the address bar at the profile's unique URL so the link is
    // copyable from the first paint.
    if (p) history.replaceState(null, "", `${location.pathname}${location.search}#${encodeShareCode(p)}`);
  }, [tierParam, router]);

  if (profile === undefined) return null; // first paint, before storage read
  if (profile === null) return <EmptyState />;
  return <ProfileViews profile={profile} drift={drift} interests={interests} />;
}

const VIEWS = [
  { key: "breakdown" as const, name: "My breakdown", desc: "The full report, for you" },
  { key: "manual" as const, name: "Working with me", desc: "The one-pager, for others" },
];

function ProfileViews({ profile, drift, interests }: {
  profile: Profile; drift: DriftReport | null; interests: InterestProfile | null;
}) {
  const [view, setView] = useState<"breakdown" | "manual">("breakdown");
  return (
    <>
      <div className="shell no-print" style={{ paddingTop: "var(--s-8)" }}>
        <div className="view-tabs" role="tablist" aria-label="Profile views">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              className="view-tab"
              role="tab"
              aria-selected={view === v.key}
              onClick={() => setView(v.key)}
            >
              <span className="vt-name">{v.name}</span>
              <span className="vt-desc">{v.desc}</span>
            </button>
          ))}
        </div>
      </div>
      {view === "breakdown"
        ? <Report profile={profile} drift={drift} interests={interests} />
        : <main className="shell reveal"><ManualSheet profile={profile} showBack={false} /></main>}
    </>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={null}>
      <ResultsInner />
    </Suspense>
  );
}
