import Link from "next/link";
import { REFERENCES } from "@/lib/data/references";

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
        {refs.map((r) => {
          const ref = REFERENCES[r];
          return (
            <li key={r}>
              {ref ? (
                <a href={ref.url} target="_blank" rel="noopener noreferrer">{ref.full}</a>
              ) : (
                r
              )}
            </li>
          );
        })}
      </ol>
      <p className="footnote" style={{ marginTop: "var(--s-4)" }}>
        The complete evidence base, including instrument validation, is on the{" "}
        <Link href="/methodology" className="cite" style={{ color: "var(--ivory-dim)" }}>Method page</Link>.
      </p>
    </section>
  );
}
