export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="mb-1 text-sm font-bold uppercase tracking-[0.2em] gradient-text">
          Operational Analytics
        </p>
        <h1 className="text-4xl font-bold tracking-tight font-[family-name:var(--font-headline)]">
          Dashboard
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { label: "Orders Today", value: "0" },
          { label: "Awaiting Pick", value: "0" },
          { label: "Packed", value: "0" },
          { label: "Total SKUs", value: "—" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="glass-panel rounded-2xl p-6 crystalline-edge"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              {kpi.label}
            </p>
            <p className="mt-2 text-4xl font-extrabold font-[family-name:var(--font-headline)]">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Welcome Card */}
      <div className="mt-8 glass-panel rounded-3xl p-8 crystalline-edge">
        <h2 className="mb-4 text-xl font-bold font-[family-name:var(--font-headline)]">
          Welcome to Kratos WMS
        </h2>
        <p className="text-on-surface-variant">
          Phase 0 foundation is complete. Use the sidebar to navigate to
          Products and Locations to start managing your warehouse.
        </p>
      </div>
    </div>
  );
}
