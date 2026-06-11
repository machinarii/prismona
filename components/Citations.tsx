import Link from "next/link";

// Tiny superscript citation marks in the text; one numbered list at the end.
export function CiteMarks({ nums }: { nums: number[] }) {
  if (!nums.length) return null;
  return (
    <sup className="cite-sup num">
      <a href="#citations" aria-label={`Citations ${nums.join(", ")}`}>{nums.join(",")}</a>
    </sup>
  );
}

export function CitationList({ refs }: { refs: string[] }) {
  if (!refs.length) return null;
  return (
    <section className="report-section" id="citations">
      <span className="label">Citations</span>
      <ol className="cite-list">
        {refs.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ol>
      <p className="footnote" style={{ marginTop: "var(--s-4)" }}>
        Full references with links and DOIs are on the{" "}
        <Link href="/method" className="cite" style={{ color: "var(--ivory-dim)" }}>Method page</Link>.
      </p>
    </section>
  );
}
