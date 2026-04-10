# Kratos WMS — Development Roadmap

## Vision

Kratos is a warehouse management system (WMS) built as a SaaS product to compete with CartonCloud. It will beat CC on **price**, **UI/UX simplicity**, and **mobile experience**. Initially built for personal use (single warehouse, ~120 SKUs, ~70 orders/day, 2 staff), then scaled to multi-tenant SaaS.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Language** | TypeScript (everywhere) | Single language across API, web, mobile. Claude is excellent at TS. |
| **Monorepo** | Turborepo + pnpm | Share types, schemas, and logic between all apps. |
| **Backend API** | Hono.js on Node.js | Lightweight, TypeScript-first, fast, deploys well in containers. |
| **Web Frontend** | Next.js 15 (App Router) + React 19 | SSR, great DX, massive ecosystem. |
| **Mobile App** | Expo (React Native) | Best cross-platform mobile framework. expo-camera for barcode scanning. Android-first. |
| **Styling** | TailwindCSS v4 + shadcn/ui | Beautiful, accessible, minimal CSS. Direct answer to CC's ugly UI. |
| **Database** | PostgreSQL (Fly.io Postgres) | Battle-tested, excellent for relational warehouse data. |
| **ORM** | Drizzle ORM | Type-safe, lightweight, great for complex queries. Better perf than Prisma. |
| **Validation** | Zod | Shared schemas between API and clients. Runtime + compile-time safety. |
| **Auth** | Better Auth | Self-hosted, multi-tenant ready, supports org/team model. |
| **Server State** | TanStack Query | Caching, revalidation, optimistic updates for both web and mobile. |
| **Testing** | Vitest (unit) + Playwright (e2e) | Fast, modern, TypeScript-native. |
| **Deployment** | Fly.io (Docker containers) | User preference. Good Postgres, global edge, affordable. |
| **CI/CD** | GitHub Actions | Free for public repos, easy Fly.io integration. |

### Why NOT these alternatives:
- **Prisma** → Heavier, slower queries, worse for complex joins needed in WMS
- **Express/Fastify** → Hono is lighter and more TypeScript-native
- **Flutter/Kotlin** → Would require learning a different language; Expo keeps us in TypeScript
- **Django/Rails** → Great frameworks but would split the codebase into 2 languages
- **PWA for mobile** → Native barcode scanning is significantly faster and more reliable in a warehouse

---

## Project Structure

```
kratos/
├── apps/
│   ├── api/                 # Hono.js backend API
│   │   ├── src/
│   │   │   ├── routes/      # API route handlers
│   │   │   ├── services/    # Business logic
│   │   │   ├── middleware/   # Auth, logging, error handling
│   │   │   └── index.ts     # App entry point
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── web/                 # Next.js web dashboard
│   │   ├── src/
│   │   │   ├── app/         # App Router pages
│   │   │   ├── components/  # React components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   └── lib/         # Utilities
│   │   ├── Dockerfile
│   │   └── package.json
│   └── mobile/              # Expo React Native app
│       ├── app/             # Expo Router screens
│       ├── components/      # RN components
│       ├── hooks/           # Custom hooks
│       └── package.json
├── packages/
│   ├── db/                  # Drizzle schema, migrations, client
│   │   ├── schema/          # Table definitions
│   │   ├── migrations/      # SQL migrations
│   │   ├── seed.ts          # Seed data
│   │   └── index.ts         # DB client export
│   ├── shared/              # Shared types, Zod schemas, constants
│   │   ├── schemas/         # Zod validation schemas
│   │   ├── types/           # TypeScript type definitions
│   │   └── constants/       # Enums, status codes, etc.
│   └── api-client/          # Generated/typed API client for web + mobile
├── docs/                    # Documentation and planning
│   ├── ROADMAP.md           # This file
│   └── cc-feature-map.md    # CC feature comparison
├── Current Setup CC/        # Exported data from CartonCloud (migration source)
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
├── CLAUDE.md
├── .gitignore
└── .github/
    └── workflows/           # CI/CD pipelines
```

---

## Carton Cloud Feature Map

### Features We USE (must build) ✅

| CC Feature | CC Workflow | Kratos MVP? | Kratos Phase |
|-----------|------------|-------------|--------------|
| **Product Management** | CRUD products, SKUs, barcodes, units of measure | ✅ MVP | Phase 1 |
| **Warehouse Locations** | Zones, aisles, bays, shelves, bins hierarchy | ✅ MVP | Phase 1 |
| **Inventory Tracking** | Stock on hand by product + location, real-time updates | ✅ MVP | Phase 2 |
| **Purchase Orders (Receiving)** | Create PO → Receive goods → Confirm quantities | ✅ MVP | Phase 3 |
| **Putaway** | After receiving, scan location → place stock | ✅ MVP | Phase 3 |
| **Sales Orders** | Create SO (manual or Shopify import) → allocate stock | ✅ MVP | Phase 4 |
| **Wave Picking (by Carrier)** | Group orders by shipping carrier → generate wave pick → pick all at once | ✅ MVP | Phase 4 |
| **Pick Lists** | Generate pick list from SO → guided picking by location | ✅ MVP | Phase 4 |
| **Packing** | Scan items into boxes, confirm packed quantities | ✅ MVP | Phase 4 |
| **Mobile Barcode Scanning** | Scan products + locations during receive/pick/pack | ✅ MVP | Phase 3-4 |
| **Stocktake** | Full or cycle count, scan to count, reconcile variances | Post-MVP | Phase 7 |
| **Stock Levels Dashboard** | View current inventory, search, filter | ✅ MVP | Phase 2 |
| **Shipping Labels** | Print labels for packed orders | Post-MVP | Phase 6 |
| **Check Inventory Levels** | Quick lookup of product stock across locations | ✅ MVP | Phase 2 |

### Features We DON'T USE (skip for now) ❌

| CC Feature | Why Skip |
|-----------|----------|
| Transport Management (TMS) | Not needed — we don't manage our own fleet |
| 3PL Billing / Rate Cards | We're not a 3PL — own inventory only |
| Customer Portal / Client Dashboard | No external customers accessing the system |
| Run Sheets | Transport feature, not applicable |
| Complex Rate Cards | No billing to external parties |
| Temperature Zones | Not needed for our product types |
| Lot/Batch/Serial Tracking | Not needed currently (can add later) |
| Expiry Date Management | Not needed currently |
| SSCC Label Generation | Not needed for our scale |
| 4PL Features | Not applicable |
| ~~Wave Picking~~ | **MOVED TO MVP** — needed for picking by carrier |
| Automated Replenishment | Not needed at MVP scale |
| Photo/Video Capture | Nice-to-have, add later |
| Back-ordering | Simple enough to manage manually initially |

### Features We'll BUILD BETTER Than CC 🚀

| Feature | CC Problem | Kratos Approach |
|---------|-----------|-----------------|
| **UI/UX** | Ugly, cluttered, confusing | Clean shadcn/ui components, minimal layouts, clear navigation |
| **Mobile Picking** | Functional but clunky | Scan-driven flow with minimal taps. Scan location → scan item → confirm → next. 3 taps max. |
| **Order Creation** | Too many clicks | Smart defaults, auto-fill, keyboard shortcuts |
| **Dashboard** | Information overload | Clean KPI cards: orders pending, orders picked, stock alerts |
| **Setup** | 6 hours average | Under 30 minutes for basic setup |
| **Price** | $99-$299+/week ($5K-$15K/year) | Target: $29-$49/month ($350-$590/year) |

---

## Development Phases

### Phase 0: Foundation (Est. 3-5 sessions)
**Goal**: Project scaffolding, database design, auth, deployment pipeline.

**Tasks:**
- [ ] 0.1 Initialize Turborepo monorepo with pnpm
- [ ] 0.2 Set up `packages/db` with Drizzle ORM + PostgreSQL schema
  - Design core tables: tenants, users, products, locations, inventory
  - Create initial migration
- [ ] 0.3 Set up `apps/api` with Hono.js
  - Health check endpoint
  - Database connection
  - Error handling middleware
  - CORS configuration
- [ ] 0.4 Set up `apps/web` with Next.js 15
  - TailwindCSS + shadcn/ui
  - Layout with sidebar navigation
  - Auth pages (login/register)
- [ ] 0.5 Set up Better Auth
  - Email/password authentication
  - Session management
  - Multi-tenant org model (foundation)
- [ ] 0.6 Dockerize API and Web apps
- [ ] 0.7 Deploy to Fly.io (API + Web + Postgres)
- [ ] 0.8 Set up GitHub Actions CI (lint, typecheck, test)
- [ ] 0.9 Set up `packages/shared` with Zod schemas

**Database Schema (Core):**
```
tenants          → id, name, slug, settings_json, created_at
users            → id, tenant_id, email, password_hash, name, role, created_at

products         → id, tenant_id, sku, name, description, barcode,
                   unit_of_measure, weight_kg, volume_m3,
                   low_stock_threshold, active, cc_uuid, created_at
-- Based on CC export: 707 products, Code=SKU=Barcode, weight in kg, volume in m³
-- cc_uuid preserved for migration cross-reference

locations        → id, tenant_id, name, barcode, row, bay, level, bin,
                   capacity, efficiency, location_type, active, created_at
-- Based on CC export: 496 locations
-- Naming: "{Row}-{Bay:02d}-L{Level}-B{Bin}" (e.g., A-01-L1-B1)
-- Barcode: no dashes (e.g., A01L1B1)
-- Rows: A-G | Bays: 1-10 | Levels: 1-4 | Bins: 1-4
-- capacity: 'single_pallet' | 'multiple_pallets'
-- location_type: 'rack' | 'floor' | 'office' | 'receiving' | 'dispatch'
-- efficiency: 1-5 (lower = higher pick priority)
-- Special: FLOOR and OFFICE (no row/bay/level, multiple pallets)
```

---

### Phase 1: Products & Locations (Est. 3-4 sessions)
**Goal**: Manage the product catalog and warehouse location hierarchy.

**Tasks:**
- [ ] 1.1 Products API (CRUD)
  - List products (search, filter, paginate)
  - Create/edit/delete product
  - Barcode assignment
  - Unit of measure support (each, carton, pallet)
  - Unit conversions (e.g., 1 carton = 12 each)
- [ ] 1.2 Products Web UI
  - Product list table with search/filter
  - Add/edit product form
  - Barcode field with validation
  - Import products from CSV/Excel
- [ ] 1.3 Locations API (CRUD)
  - Location hierarchy: Zone → Aisle → Bay → Shelf → Bin
  - Location types: Bulk storage, pick face
  - Location barcodes (auto-generated or manual)
  - Bulk location creation (e.g., "create A-01-01 through A-01-20")
- [ ] 1.4 Locations Web UI
  - Visual warehouse map (simple grid view)
  - Location list with hierarchy browser
  - Bulk creation wizard
  - Location details showing current stock

---

### Phase 2: Inventory & Data Migration (Est. 3-4 sessions)
**Goal**: Track stock levels and import existing data from Carton Cloud.

**Tasks:**
- [ ] 2.1 Inventory data model
  - `inventory` table: product_id, location_id, quantity, tenant_id
  - Stock adjustments table (audit trail)
  - Stock movement history
- [ ] 2.2 Inventory API
  - Get stock on hand (by product, by location, total)
  - Manual stock adjustment (add/remove/set)
  - Stock movement log
- [ ] 2.3 Inventory Web UI
  - Stock dashboard: total products, total units, low stock alerts
  - Stock on hand table: product | location | qty | last movement
  - Quick stock lookup (search by product name, SKU, or barcode)
  - Stock adjustment form
- [ ] 2.4 Data Migration: Import CC Warehouse Locations (496 locations)
  - Parse `Current Setup CC/WarehouseLocations-2026-04-06.xls`
  - Field mapping:
    - `name` → location name (e.g., "A-01-L1-B1")
    - `barcode` → barcode (e.g., "A01L1B1")
    - `row` → row (A-G)
    - `bay` → bay (1-10)
    - `level` → level (1-4)
    - Parse bin from name (B1-B4)
    - `capacity` → "Single Pallet" | "Multiple Pallets"
    - `efficiency` → pick priority (1-5)
    - `active` → boolean
    - Special locations: FLOOR, OFFICE → location_type='floor'/'office' (no row/bay/level)
  - Import script with validation and dry-run mode
- [ ] 2.5 Data Migration: Import CC Products (707 products)
  - Parse `Current Setup CC/Products.xlsx`
  - Field mapping:
    - `Name` → name
    - `Code` → sku
    - `Barcode` (col 48, Conversion Measurement 1) → barcode (currently same as Code)
    - `Weight (Kilograms)` → weight_kg
    - `Volume (cubic Meters)` → volume_m3
    - `Low Stock Threshold` → low_stock_threshold
    - `Active` → active
    - `Uuid` → cc_uuid (for cross-reference)
    - `Product Description` → description
  - Skip CC-specific fields: Storage Charge, POP fields, Rate Cards, Charge Groups
  - Import script with duplicate detection (match on sku)
- [ ] 2.6 Data Migration: Import Current Stock Levels
  - Export stock-on-hand from CC (CSV export or CC API)
  - Map CC location names to Kratos location IDs
  - Map CC product codes to Kratos product IDs
  - Import into Kratos inventory with location mapping
  - Reconciliation report: expected vs imported totals

---

### Phase 3: Inbound — Receiving & Putaway (Est. 4-5 sessions)
**Goal**: Receive goods into the warehouse and put them in the right locations.

**Tasks:**
- [ ] 3.1 Purchase Order data model
  - `purchase_orders` table: id, tenant_id, supplier, status, expected_date, notes
  - `purchase_order_lines` table: po_id, product_id, expected_qty, received_qty
  - PO statuses: Draft → Awaiting Arrival → Receiving → Received → Closed
- [ ] 3.2 Purchase Order API
  - CRUD purchase orders
  - Add/remove product lines
  - Receive against PO (update received quantities)
  - Complete receiving
- [ ] 3.3 Purchase Order Web UI
  - PO list with status filters
  - Create PO form (select supplier, add products, set quantities)
  - Receiving screen: show expected vs received, confirm quantities
- [ ] 3.4 Putaway API
  - Generate putaway tasks after receiving
  - Assign product to location
  - Confirm putaway (updates inventory)
- [ ] 3.5 **Mobile App: Initialize Expo project**
  - Set up Expo with expo-router
  - Authentication flow (login screen, session management)
  - API client (shared from packages/api-client)
  - Bottom tab navigation
- [ ] 3.6 **Mobile App: Barcode Scanner**
  - Camera permission handling
  - Barcode scanning component (supports EAN-13, Code128, Code39, QR)
  - Scan feedback (vibration + sound + visual)
- [ ] 3.7 **Mobile App: Receive Workflow**
  - Select PO from list
  - Scan product barcode → shows expected qty → enter/confirm received qty
  - Mark PO as received
- [ ] 3.8 **Mobile App: Putaway Workflow**
  - Show pending putaway tasks
  - Scan location barcode → scan product barcode → confirm
  - Update stock location in real-time

**Workflow (CC-inspired, simplified):**
```
1. Create Purchase Order (web)
2. Goods arrive → open PO on mobile
3. Scan each product barcode → confirm quantity → tap Confirm
4. All items received → tap "Complete Receiving"
5. System generates putaway tasks
6. On mobile: scan location → scan product → tap "Put Away"
7. Inventory updated in real-time
```

---

### Phase 4: Outbound — Orders, Wave Picking & Packing (Est. 6-8 sessions)
**Goal**: Process sales orders through carrier-based wave picking and packing. This is the core workflow.

**Tasks:**
- [ ] 4.1 Sales Order data model
  - `sales_orders` table: id, tenant_id, customer_name, shipping_address, status, source, **carrier** (e.g., 'auspost', 'tge', 'toll', 'allied', 'tnt'), **shipping_service**
  - `sales_order_lines` table: so_id, product_id, ordered_qty, picked_qty, packed_qty
  - SO statuses: Draft → Awaiting Pick → Picking → Awaiting Pack → Packing → Packed → Shipped
  - Stock allocation: reserve inventory when SO is confirmed
- [ ] 4.2 Sales Order API
  - CRUD sales orders
  - Manual creation + bulk import
  - Carrier assignment (required field per order)
  - Auto-allocate stock (FIFO by default)
  - Release/cancel stock allocation
  - Generate pick list
- [ ] 4.3 Sales Order Web UI
  - Order list with status pipeline view, **filterable by carrier**
  - Create order form (customer, products, quantities, **carrier dropdown**)
  - Order detail showing allocation status
  - Bulk actions (allocate all, release all, print pick lists)
- [ ] 4.4 **Wave Pick by Carrier**
  - Wave pick creation UI: select carrier → system shows all "Awaiting Pick" orders for that carrier
  - One-click "Create Wave" groups selected orders into a single pick run
  - Wave pick list: consolidated product list across all orders, sorted by location for efficient path
  - Each wave tracks which orders are included and pick progress
  - Wave statuses: Created → In Progress → Completed
  - Printable consolidated pick list (PDF)
  - Digital wave pick list for mobile
- [ ] 4.5 Pick List generation (single order fallback)
  - Group by location for efficient pick path (sort by Zone → Aisle → Bay → Shelf)
  - Printable pick list (PDF)
  - Digital pick list for mobile
- [ ] 4.6 **Mobile App: Picking Workflow (supports wave picks)**
  - Show available wave picks and single-order pick lists
  - Wave pick mode: consolidated list — "Pick 15x Widget A from A-01-03 (for 5 orders)"
  - Guided picking: "Go to location A-01-03" → scan location → scan product → confirm qty
  - Pick confirmation updates all associated SO lines
  - Progress indicator: "5 of 12 items picked"
  - Handle short picks (not enough stock at location)
  - On wave complete: system splits picked items back to individual orders for packing
- [ ] 4.7 Packing data model
  - `packages` table: id, sales_order_id, box_number, weight, dimensions
  - `package_items` table: package_id, sales_order_line_id, qty
- [ ] 4.8 **Mobile App: Packing Workflow**
  - Select order to pack (or scan order barcode)
  - Scan items into boxes
  - Confirm all items packed
  - Enter weight/dimensions (optional)
  - Mark order as "Packed"
- [ ] 4.9 Dispatch confirmation
  - Mark orders as shipped
  - Record carrier + tracking number (manual for now)

**Workflow (CC-inspired, simplified):**
```
1. Sales orders arrive (manual or Shopify import), each assigned a carrier
2. System auto-allocates stock from inventory
3. Supervisor filters orders by carrier (e.g., "all AusPost orders")
4. One click → "Create Wave Pick" for selected carrier's orders
5. Wave pick consolidates all products across those orders into one pick run
6. Picker opens wave pick on mobile phone
7. "Go to A-01-03 → pick 15x Widget A" → scan location → scan product → confirm qty → NEXT
8. All items picked → system splits items back to individual orders
9. Each order moves to "Awaiting Pack"
10. At pack station: scan order → scan items into boxes → confirm
11. Order marked as "Packed" → ready for shipping
```

---

### Phase 5: Shopify Integration (Est. 2-3 sessions)
**Goal**: Auto-import orders from Shopify and sync inventory back.

**Tasks:**
- [ ] 5.1 Shopify OAuth app setup
- [ ] 5.2 Order webhook: new Shopify order → create Kratos sales order
- [ ] 5.3 Inventory sync: Kratos stock changes → update Shopify inventory levels
- [ ] 5.4 Fulfillment sync: Kratos marks shipped → Shopify order fulfilled with tracking
- [ ] 5.5 Product sync (optional): Shopify products → Kratos products
- [ ] 5.6 Integration settings page (connect/disconnect, mapping config)

---

### Phase 6: Carrier Integration & Shipping Labels (Est. 3-4 sessions)
**Goal**: Generate shipping labels directly from packed orders.

**Tasks:**
- [ ] 6.1 Carrier abstraction layer (pluggable carrier interface)
- [ ] 6.2 AusPost integration (MyPost Business API)
  - Get shipping rates
  - Create shipment + generate label
  - Get tracking updates
- [ ] 6.3 Carrier settings page (API keys, default services)
- [ ] 6.4 Label printing
  - Generate ZPL/PDF labels
  - Print to thermal printer (via browser print or network printer)
  - Batch label printing
- [ ] 6.5 Additional carriers (TGE, Toll, Allied Express, TNT)
  - Each as a pluggable module

---

### Phase 7: Reporting & Stocktake (Est. 2-3 sessions)
**Goal**: Operational reporting and inventory accuracy.

**Tasks:**
- [ ] 7.1 Stock on hand report (current snapshot, filterable)
- [ ] 7.2 Stock movement report (date range, product, location)
- [ ] 7.3 Order fulfillment metrics (orders/day, avg pick time, accuracy)
- [ ] 7.4 Low stock alerts (configurable thresholds)
- [ ] 7.5 Stocktake workflow
  - Create stocktake (full or by zone)
  - Mobile: scan location → scan products → enter count
  - Variance report (expected vs counted)
  - Approve adjustments
- [ ] 7.6 Dashboard KPIs
  - Orders today / this week
  - Units picked today
  - Pending pick/pack counts
  - Stock value (if product costs tracked)

---

### Phase 8: Xero Integration (Est. 2-3 sessions)
**Goal**: Sync financial data with Xero.

**Tasks:**
- [ ] 8.1 Xero OAuth2 connection
- [ ] 8.2 Invoice creation from shipped orders
- [ ] 8.3 Product cost tracking + COGS
- [ ] 8.4 Xero settings page

---

### Phase 9: Multi-Tenancy & SaaS (Est. 4-6 sessions)
**Goal**: Transform from single-user to multi-tenant SaaS.

**Tasks:**
- [ ] 9.1 Tenant isolation (row-level security in Postgres)
- [ ] 9.2 Public marketing site / landing page
- [ ] 9.3 Self-service sign-up flow
- [ ] 9.4 Subscription billing (Stripe integration)
  - Free trial
  - Tiered plans based on order volume or users
- [ ] 9.5 Onboarding wizard (setup warehouse, import products, connect Shopify)
- [ ] 9.6 Admin panel (manage tenants, view usage)
- [ ] 9.7 Multi-warehouse support per tenant

---

### Phase 10: Advanced Features (Ongoing)
**Goal**: Feature parity with CC for competitive positioning.

**Tasks:**
- [ ] 10.1 ~~Wave picking~~ — **MOVED to Phase 4 (MVP)** — pick by carrier
- [ ] 10.2 Batch picking (pick-to-tote for single orders)
- [ ] 10.3 Automated replenishment (bulk → pick face)
- [ ] 10.4 Photo/video capture on receive + dispatch
- [ ] 10.5 Customer portal (for future 3PL support)
- [ ] 10.6 Back-ordering
- [ ] 10.7 Lot/batch/serial tracking
- [ ] 10.8 Expiry date management (FEFO picking)
- [ ] 10.9 3PL billing & rate cards
- [ ] 10.10 Custom reports builder

---

## Database Schema Overview

### Core Tables (Phase 0-2)
```sql
-- Multi-tenancy foundation
tenants (id, name, slug, settings_json, created_at)
users (id, tenant_id, email, password_hash, name, role, created_at)

-- Products (707 from CC export)
products (id, tenant_id, sku, name, description, barcode, 
          unit_of_measure, weight_kg, volume_m3,
          low_stock_threshold, active, cc_uuid, created_at, updated_at)
-- CC mapping: Code→sku, Name→name, Barcode(col48)→barcode, 
--             Weight(kg)→weight_kg, Volume(m³)→volume_m3, Uuid→cc_uuid

-- Warehouse Locations (496 from CC export)
locations (id, tenant_id, name, barcode, row, bay, level, bin,
           capacity, efficiency, location_type, active, created_at)
-- CC naming: "A-01-L1-B1" → row=A, bay=1, level=1, bin=1
-- CC barcode: "A01L1B1" (no dashes)
-- capacity: 'single_pallet' | 'multiple_pallets'
-- location_type: 'rack' | 'floor' | 'office' | 'receiving' | 'dispatch'
-- efficiency: 1-5 (lower = higher pick priority, used for location-based stock selection)

-- Inventory (stock on hand)
inventory (id, tenant_id, product_id, location_id, quantity, 
           updated_at)
-- Unique constraint on (tenant_id, product_id, location_id)

-- Audit trail
stock_movements (id, tenant_id, product_id, from_location_id, 
                 to_location_id, quantity, movement_type, 
                 reference_type, reference_id, user_id, created_at)
-- movement_type: 'receive' | 'putaway' | 'pick' | 'adjust' | 'transfer' | 'stocktake'
```

### Inbound Tables (Phase 3)
```sql
purchase_orders (id, tenant_id, supplier_name, status, 
                 expected_date, notes, created_by, created_at)
-- status: 'draft' | 'awaiting_arrival' | 'receiving' | 'received' | 'closed'

purchase_order_lines (id, po_id, product_id, expected_qty, 
                      received_qty, created_at)
```

### Outbound Tables (Phase 4)
```sql
sales_orders (id, tenant_id, order_number, customer_name, 
              shipping_address_json, carrier, shipping_service,
              status, source, external_id, created_at)
-- carrier: 'auspost' | 'tge' | 'toll' | 'allied_express' | 'tnt' | 'other'
-- status: 'draft' | 'awaiting_pick' | 'picking' | 'awaiting_pack' | 'packing' | 'packed' | 'shipped' | 'cancelled'
-- source: 'manual' | 'shopify' | 'api'

sales_order_lines (id, so_id, product_id, ordered_qty, 
                   allocated_qty, picked_qty, packed_qty)

-- Stock allocation (reserves inventory for orders)
stock_allocations (id, tenant_id, sales_order_line_id, 
                   inventory_id, quantity, created_at)

-- Wave picks (group orders by carrier for batch picking)
wave_picks (id, tenant_id, carrier, status, 
            created_by, created_at, completed_at)
-- status: 'created' | 'in_progress' | 'completed'

wave_pick_orders (id, wave_pick_id, sales_order_id)
-- Links which sales orders belong to this wave

wave_pick_items (id, wave_pick_id, product_id, location_id, 
                 total_qty, picked_qty, picked_by, picked_at)
-- Consolidated pick lines: total_qty = sum across all orders needing this product

-- Single-order pick lists (fallback when not using wave picks)
pick_lists (id, tenant_id, status, created_by, created_at)
pick_list_items (id, pick_list_id, sales_order_line_id, 
                 product_id, location_id, quantity, 
                 picked_qty, picked_by, picked_at)

-- Packages (packing)
packages (id, sales_order_id, label, weight_kg, 
          length_cm, width_cm, height_cm, tracking_number, 
          carrier, created_at)
package_items (id, package_id, sales_order_line_id, quantity)
```

---

## Key Design Principles

1. **Fewer clicks, always.** If CC takes 5 clicks, we do it in 2-3.
2. **Scan-driven mobile.** Warehouse workers should barely touch the screen. Scan barcode → system responds → next action.
3. **Smart defaults.** Don't ask the user to configure what we can assume. One warehouse? Auto-selected. One unit of measure? Skip the dropdown.
4. **Real-time everything.** Stock updates immediately on scan. No "sync" buttons.
5. **Clean UI.** White space, clear typography, obvious actions. No information overload.
6. **Multi-tenant from day one.** Every table has `tenant_id`. Row-level security ready. Even if there's only one tenant now.
7. **API-first.** Every feature is an API endpoint first, then UI. This enables mobile, integrations, and future extensibility.

---

## Session-Based Task Breakdown

Each phase is broken into tasks that can be completed in a single Claude Code session (roughly 1-3 hours of focused work). Tasks are numbered like `X.Y` where X = phase, Y = task within phase.

When starting a session:
1. Check the roadmap for the current phase
2. Pick the next uncompleted task
3. Use `/plan` to discuss approach if the task is complex
4. Build it
5. Test it
6. Commit with a clear message referencing the task number (e.g., "feat(3.6): mobile barcode scanner component")
