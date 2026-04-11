export default function WavePicksPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] gradient-text">
          Outbound
        </p>
        <h1 className="text-4xl font-bold tracking-tight font-[family-name:var(--font-headline)]">
          Wave Picks
        </h1>
      </div>
      <div className="glass-panel rounded-3xl p-8 crystalline-edge">
        <p className="text-on-surface-variant">
          Wave picking by carrier is coming in Phase 4. You'll group orders by shipping carrier and pick them in a single run.
        </p>
      </div>
    </div>
  );
}
