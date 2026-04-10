import {
  pgTable,
  text,
  integer,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";
import { products } from "./products";

export const purchaseOrders = pgTable("purchase_orders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  supplierName: text("supplier_name").notNull(),
  status: text("status", {
    enum: ["draft", "awaiting_arrival", "receiving", "received", "closed"],
  })
    .notNull()
    .default("draft"),
  expectedDate: date("expected_date"),
  notes: text("notes"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const purchaseOrderLines = pgTable("purchase_order_lines", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  purchaseOrderId: text("purchase_order_id")
    .notNull()
    .references(() => purchaseOrders.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  expectedQty: integer("expected_qty").notNull(),
  receivedQty: integer("received_qty").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
