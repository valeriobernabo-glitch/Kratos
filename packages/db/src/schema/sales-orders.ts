import {
  pgTable,
  text,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";
import { products } from "./products";
import { inventory } from "./inventory";

export const salesOrders = pgTable("sales_orders", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  orderNumber: text("order_number").notNull(),
  customerName: text("customer_name").notNull(),
  shippingAddress: jsonb("shipping_address"),
  carrier: text("carrier", {
    enum: ["auspost", "tge", "toll", "allied_express", "tnt", "other"],
  }).notNull(),
  shippingService: text("shipping_service"),
  status: text("status", {
    enum: [
      "draft",
      "awaiting_pick",
      "picking",
      "awaiting_pack",
      "packing",
      "packed",
      "shipped",
      "cancelled",
    ],
  })
    .notNull()
    .default("draft"),
  source: text("source", {
    enum: ["manual", "shopify", "csv", "api"],
  })
    .notNull()
    .default("manual"),
  externalId: text("external_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const salesOrderLines = pgTable("sales_order_lines", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  salesOrderId: text("sales_order_id")
    .notNull()
    .references(() => salesOrders.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  orderedQty: integer("ordered_qty").notNull(),
  allocatedQty: integer("allocated_qty").notNull().default(0),
  pickedQty: integer("picked_qty").notNull().default(0),
  packedQty: integer("packed_qty").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const stockAllocations = pgTable("stock_allocations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  salesOrderLineId: text("sales_order_line_id")
    .notNull()
    .references(() => salesOrderLines.id, { onDelete: "cascade" }),
  inventoryId: text("inventory_id")
    .notNull()
    .references(() => inventory.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
