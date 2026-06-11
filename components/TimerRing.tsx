"use client";

const R = 24;
const CIRC = 2 * Math.PI * R;

export function TimerRing({ leftMs, limitMs }: { leftMs: number; limitMs: number }) {
  const frac = Math.max(0, Math.min(1, leftMs / limitMs));
  const secs = Math.ceil(leftMs / 1000);
  return (
    <div className={`timer-ring${leftMs < 5000 ? " low" : ""}`} role="timer" aria-label={`${secs} seconds remaining`}>
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle className="track" cx="26" cy="26" r={R} />
        <circle
          className="arc"
          cx="26"
          cy="26"
          r={R}
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - frac)}
        />
      </svg>
      <span>{secs}</span>
    </div>
  );
}
