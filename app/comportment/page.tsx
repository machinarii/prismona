import { ComportmentPanel } from "@/components/ComportmentPanel";

export const metadata = { title: "Comportment — Prismona" };

// Dedicated relationship surface: configure how the agent's register (comportment)
// adapts to each kind of counterparty. The persona stays fixed; only comportment moves.
export default function ComportmentPage() {
  return (
    <main className="shell reveal">
      <section className="arch-display">
        <p className="label gold">How my agent treats different people</p>
        <h1 className="display" style={{ fontSize: "var(--t-display)", margin: "12px 0 16px" }}>
          Comportment
        </h1>
        <p className="prose">
          Your <em>persona</em> is fixed — who your agent is, calibrated to complement you.{" "}
          <em>Comportment</em> is the register it adapts to whoever it&apos;s dealing with: more
          deference with a president than a manager, more guarded with a stranger&apos;s agent than a
          teammate. Pick a relationship; each bar starts at the recommended default (the tick), and
          you nudge from there. The honesty floor is never a slider.
        </p>
      </section>
      <section className="report-section">
        <ComportmentPanel />
      </section>
    </main>
  );
}
