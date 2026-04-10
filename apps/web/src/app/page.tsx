export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl gradient-cta shadow-lg shadow-primary/30">
          <span className="text-4xl font-bold text-white font-[family-name:var(--font-headline)]">
            K
          </span>
        </div>
        <h1 className="mb-2 text-4xl font-bold tracking-tight font-[family-name:var(--font-headline)]">
          Kratos WMS
        </h1>
        <p className="text-on-surface-variant">
          Warehouse Management System — Phase 0 Foundation
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a
            href="/dashboard"
            className="rounded-xl gradient-cta px-6 py-3 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:brightness-110"
          >
            Open Dashboard
          </a>
          <a
            href="http://localhost:3001/api/health"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-surface-container-high px-6 py-3 text-sm font-bold text-primary transition-all hover:bg-surface-container-highest"
          >
            API Health Check
          </a>
        </div>
      </div>
    </div>
  );
}
