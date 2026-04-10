import {
  pgTable,
  text,
  integer,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";
import { products } from "./products";
import { locations } from "./locations";

export const inventory = pgTable(
  "inventory",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    locationId: text("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    unique("uq_inventory_tenant_product_location").on(
      table.tenantId,
      table.productId,
      table.locationId,
    ),
  ],
);

export const stockMovements = pgTable("stock_movements", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  fromLocationId: text("from_location_id").references(() => locations.id, {
    onDelete: "set null",
  }),
  toLocationId: text("to_location_id").references(() => locations.id, {
    onDelete: "set null",
  }),
  quantity: integer("quantity").notNull(),
  movementType: text("movement_type", {
    enum: ["receive", "putaway", "pick", "adjust", "transfer", "stocktake"],
  }).notNull(),
  referenceType: text("reference_type", {
    enum: [
      "purchase_order",
      "sales_order",
      "wave_pick",
      "stocktake",
      "manual",
    ],
  }),
  referenceId: text("reference_id"),
  userId: text("user_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
