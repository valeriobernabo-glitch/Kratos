export default function SalesOrdersPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] gradient-text">
          Outbound
        </p>
        <h1 className="text-4xl font-bold tracking-tight font-[family-name:var(--font-headline)]">
          Sales Orders
        </h1>
      </div>
      <div className="glass-panel rounded-3xl p-8 crystalline-edge">
        <p className="text-on-surface-variant">
          Sales order management is coming in Phase 4. You'll process orders, generate pick lists, and manage packing.
        </p>
      </div>
    </div>
  );
}
