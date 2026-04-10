export default function DashboardPage() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 glass-sidebar flex flex-col gap-2 px-4 py-6 crystalline-edge border-r border-white/20">
        <div className="mb-6 px-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Kratos"
              className="h-10 w-auto"
            />
            <div>
              <h3 className="text-sm font-bold leading-tight font-[family-name:var(--font-headline)]">
                Kratos WMS
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                Trade Hero AU
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {[
            { label: "Dashboard", active: true },
            { label: "Products" },
            { label: "Locations" },
            { label: "Inventory" },
            { label: "Purchase Orders" },
            { label: "Sales Orders" },
            { label: "Wave Picks" },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all ${
                item.active
                  ? "border-r-4 border-tertiary bg-primary/10 font-bold text-primary"
                  : "text-on-surface-variant hover:bg-white/40 hover:pl-6"
              }`}
            >
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        <div className="mt-auto space-y-2 border-t border-white/20 pt-4">
          <div className="cursor-pointer px-4 py-2 text-sm text-on-surface-variant hover:text-primary">
            Settings
          </div>
          <div className="cursor-pointer px-4 py-2 text-sm text-on-surface-variant hover:text-error">
            Logout
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 px-8 py-8">
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
            { label: "Orders Today", value: "0", color: "primary" },
            { label: "Awaiting Pick", value: "0", color: "tertiary" },
            { label: "Packed", value: "0", color: "secondary" },
            { label: "Total SKUs", value: "707", color: "primary" },
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

        {/* Placeholder content */}
        <div className="mt-8 glass-panel rounded-3xl p-8 crystalline-edge">
          <h2 className="mb-4 text-xl font-bold font-[family-name:var(--font-headline)]">
            Welcome to Kratos WMS
          </h2>
          <p className="text-on-surface-variant">
            Phase 0 foundation is complete. Next steps: build out Product
            and Location management (Phase 1).
          </p>
        </div>
      </main>
    </div>
  );
}
