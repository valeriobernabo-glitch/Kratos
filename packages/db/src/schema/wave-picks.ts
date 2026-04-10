import {
  pgTable,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";
import { salesOrders } from "./sales-orders";
import { products } from "./products";
import { locations } from "./locations";

export const wavePicks = pgTable("wave_picks", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  carrier: text("carrier", {
    enum: ["auspost", "tge", "toll", "allied_express", "tnt", "other"],
  }).notNull(),
  status: text("status", {
    enum: ["created", "in_progress", "completed"],
  })
    .notNull()
    .default("created"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const wavePickOrders = pgTable("wave_pick_orders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  wavePickId: text("wave_pick_id")
    .notNull()
    .references(() => wavePicks.id, { onDelete: "cascade" }),
  salesOrderId: text("sales_order_id")
    .notNull()
    .references(() => salesOrders.id, { onDelete: "cascade" }),
});

export const wavePickItems = pgTable("wave_pick_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  wavePickId: text("wave_pick_id")
    .notNull()
    .references(() => wavePicks.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  locationId: text("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  totalQty: integer("total_qty").notNull(),
  pickedQty: integer("picked_qty").notNull().default(0),
  pickedBy: text("picked_by"),
  pickedAt: timestamp("picked_at", { withTimezone: true }),
});
