export default function PurchaseOrdersPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] gradient-text">
          Inbound
        </p>
        <h1 className="text-4xl font-bold tracking-tight font-[family-name:var(--font-headline)]">
          Purchase Orders
        </h1>
      </div>
      <div className="glass-panel rounded-3xl p-8 crystalline-edge">
        <p className="text-on-surface-variant">
          Purchase order management is coming in Phase 3. You'll create POs, receive goods, and manage putaway.
        </p>
      </div>
    </div>
  );
}
