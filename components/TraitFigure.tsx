import { figureGeometry } from "@/lib/figure";
import type { Profile } from "@/lib/types";

// Parametric trait engraving: hairline guide rings, gold uncertainty ring,
// ivory point polygon. Pure SVG generated from the profile — prints vector.
export function TraitFigure({ profile, size = 280 }: { profile: Profile; size?: number }) {
  const g = figureGeometry(profile, size);
  const c = size / 2;
  return (
    <svg
      className="trait-figure"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Trait figure: a six-axis engraving of this blueprint's percentiles and uncertainty bands"
    >
      {g.rings.map((r) => (
        <circle key={r} cx={c} cy={c} r={r} className="ring" />
      ))}
      {g.axes.map((a, i) => (
        <line key={i} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} className="axis" />
      ))}
      <path d={g.band} className="band" fillRule="evenodd" />
      <path d={g.line} className="line" />
      {g.ticks.map((t, i) => (
        <circle key={i} cx={t.x} cy={t.y} r={2.4} className="tick" />
      ))}
      {g.labels.map((l) => (
        <text key={l.text} x={l.x} y={l.y} className="axis-label" textAnchor="middle" dominantBaseline="central">
          {l.text}
        </text>
      ))}
    </svg>
  );
}
