# Kratos WMS

Warehouse Management System — built to replace CartonCloud with better UX, simpler workflows, and lower cost.

## What This Project Is

Kratos is a SaaS WMS starting as a personal tool (1 warehouse, ~120 SKUs, ~70 orders/day, 2 staff) and scaling to a multi-tenant competitor to CartonCloud. The three apps (API, web dashboard, mobile scanner) live in one Turborepo monorepo.

## Tech Stack

- **Language**: TypeScript everywhere
- **Monorepo**: Turborepo + pnpm
- **API**: Hono.js (apps/api)
- **Web**: Next.js 15 + React 19 + TailwindCSS v4 + shadcn/ui (apps/web)
- **Mobile**: Expo / React Native (apps/mobile)
- **Database**: PostgreSQL (Fly.io Postgres)
- **ORM**: Drizzle ORM (packages/db)
- **Validation**: Zod (packages/shared)
- **Auth**: Better Auth (multi-tenant org model)
- **State**: TanStack Query (server state), Zustand (client state)
- **Testing**: Vitest (unit), Playwright (e2e)
- **Deploy**: Fly.io (Docker containers)
- **CI**: GitHub Actions

## Project Structure

```
apps/api/         → Hono.js backend API
apps/web/         → Next.js web dashboard
apps/mobile/      → Expo React Native app
packages/db/      → Drizzle schema, migrations, seed
packages/shared/  → Zod schemas, TypeScript types, constants
packages/api-client/ → Typed API client for web + mobile
docs/             → Roadmap, CC feature map, architecture docs
```

## Key Commands

```bash
pnpm install              # Install all dependencies
pnpm dev                  # Run all apps in dev mode (turbo)
pnpm dev --filter=api     # Run only the API
pnpm dev --filter=web     # Run only the web app
pnpm build                # Build all apps
pnpm lint                 # Lint all packages
pnpm typecheck            # TypeScript check all packages
pnpm test                 # Run all tests
pnpm db:generate          # Generate Drizzle migrations
pnpm db:migrate           # Run migrations
pnpm db:seed              # Seed database
pnpm db:studio            # Open Drizzle Studio (DB browser)
```

## Conventions

### Code Style
- Use named exports, not default exports
- Use `async/await`, never raw promises with `.then()`
- API routes return consistent shapes: `{ data }` on success, `{ error, message }` on failure
- Database queries go in `apps/api/src/services/`, not in route handlers
- Zod schemas in `packages/shared/schemas/` — import from there in both API and clients
- Use barrel exports (`index.ts`) in packages, not deep imports

### Naming
- Files: `kebab-case.ts` (e.g., `sales-order.ts`)
- Components: `PascalCase.tsx` (e.g., `SalesOrderList.tsx`)
- Database tables: `snake_case` plural (e.g., `sales_orders`)
- API routes: `kebab-case` (e.g., `/api/sales-orders`)
- Types/Interfaces: `PascalCase` (e.g., `SalesOrder`)
- Zod schemas: `camelCase` + `Schema` suffix (e.g., `salesOrderSchema`)

### Database
- Every table has `tenant_id` for multi-tenancy (even now with 1 tenant)
- Every table has `created_at` timestamp
- Mutable records also have `updated_at`
- Use `text` for IDs (nanoid or cuid2), not auto-increment integers
- Foreign keys always have `ON DELETE` behavior defined
- Migrations are forward-only; never edit a committed migration

### Git
- Branch from `main`
- Commit messages: `type(scope): description` (e.g., `feat(3.5): mobile app initialization`)
- Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`
- Scope = task number from roadmap or module name
- One logical change per commit

### Testing
- Unit test business logic in `services/`
- Integration test API routes
- E2E test critical workflows (receive, pick, pack)
- Mobile: test with Expo Go on physical Android device

## Design Principles

1. **Fewer clicks.** Every workflow should take fewer steps than CartonCloud. If CC needs 5 clicks, we need 2-3.
2. **Scan-driven mobile.** Warehouse workers scan barcodes — minimal screen touching. Scan → system responds → next.
3. **Smart defaults.** Don't ask users to configure what can be assumed. Single warehouse = auto-selected. One UoM = skip dropdown.
4. **Real-time.** Stock updates immediately on scan. No "sync" buttons.
5. **Clean UI.** Generous white space, clear typography, obvious CTAs. We compete on aesthetics.
6. **API-first.** Build the API endpoint, then the UI. Everything is an API call.
7. **Multi-tenant from day one.** `tenant_id` on every table. No shortcuts.

## Things Claude Should Do

- Always check `docs/ROADMAP.md` for the current phase and task breakdown
- Reference the CC feature map when building features — understand how CC does it, then simplify
- Write Zod schemas FIRST, then derive TypeScript types from them
- When building UI, use shadcn/ui components — don't create custom components unless shadcn doesn't have one
- Use Drizzle's query builder, not raw SQL (unless the query is too complex)
- Keep mobile workflows minimal: scan → confirm → next
- Run `pnpm typecheck` after making changes across packages
- Write migration files, don't modify existing ones

## Things Claude Should NOT Do

- Don't add features not in the current phase's task list
- Don't add lot/batch/serial tracking unless explicitly asked (not needed yet)
- Don't build transport/TMS features
- Don't add 3PL billing or rate cards
- Don't over-engineer: no microservices, no event sourcing, no CQRS
- Don't use Prisma (we use Drizzle)
- Don't use CSS modules or styled-components (we use Tailwind)
- Don't add comments explaining obvious code
- Don't create README.md files in every directory
- Don't use `any` type — always type properly or use `unknown` + narrowing

## Current Phase

> **Phase 0: Foundation** — Project scaffolding, database design, auth, deployment pipeline.
> See `docs/ROADMAP.md` for task breakdown.

## Reference: CartonCloud

We model Kratos workflows after CartonCloud's approach (without copying their code/UI). Key CC docs:
- Features: https://www.cartoncloud.com/warehouse-management-system/features
- API: https://api-docs.cartoncloud.com/
- Help center: https://help.cartoncloud.com/
- Mobile workflows: scan-driven receive → putaway → pick → pack → ship

The `Current Setup CC/` folder contains exported data (products + locations) for migration.
