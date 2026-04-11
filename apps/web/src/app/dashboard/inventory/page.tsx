export default function InventoryPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] gradient-text">
          Warehouse
        </p>
        <h1 className="text-4xl font-bold tracking-tight font-[family-name:var(--font-headline)]">
          Inventory
        </h1>
      </div>
      <div className="glass-panel rounded-3xl p-8 crystalline-edge">
        <p className="text-on-surface-variant">
          Inventory management is coming in Phase 2. You'll be able to view stock levels, make adjustments, and track movements.
        </p>
      </div>
    </div>
  );
}
