// Percentile bar with uncertainty band: hairline track, champagne band
// (±1 SEM), ivory tick at the point estimate.
export function BandBar({ name, pct, lo, hi }: { name: string; pct: number; lo: number; hi: number }) {
  return (
    <div className="band-row">
      <span className="name">{name}</span>
      <div
        className="band-track"
        role="img"
        aria-label={`${name}: ${pct}th percentile, likely range ${lo} to ${hi}`}
      >
        <span className="band" style={{ left: `${lo}%`, width: `${Math.max(1, hi - lo)}%` }} />
        <span className="tick" style={{ left: `calc(${pct}% - 1px)` }} />
      </div>
      <span className="val num">{pct}</span>
    </div>
  );
}
