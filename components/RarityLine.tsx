import { distinctiveness } from "@/lib/rarity";
import { ARCHETYPE_BASE_RATES } from "@/lib/data/baserates";
import type { Profile, ReportKey } from "@/lib/types";

// "How rare is this combination?" — Mahalanobis distinctiveness plus the
// simulated base rate of the nearest archetype. Honest framing: an estimate
// against provisional norms, never a type prevalence claim.
export function RarityLine({ profile, topName }: { profile: Profile; topName?: string }) {
  const z = Object.fromEntries(
    (["O", "C", "E", "A", "ES", "H"] as ReportKey[]).map((k) => [k, profile.traits[k].z]),
  ) as Record<ReportKey, number>;
  const rare = distinctiveness(z);
  const base = topName ? ARCHETYPE_BASE_RATES[topName] : undefined;
  return (
    <p className="prose" style={{ marginTop: "var(--s-6)" }}>
      This six-trait combination is more distinctive than{" "}
      <strong className="num">{rare.pct}%</strong> of people
      {rare.oneIn >= 2 && <> — roughly <strong className="num">1 in {Math.round(rare.oneIn)}</strong></>}
      {base != null && (
        <>; about <strong className="num">{base}%</strong> of a norm population lands nearest {topName}</>
      )}
      . Estimated from meta-analytic trait correlations and provisional norms — method, not mysticism.
    </p>
  );
}
