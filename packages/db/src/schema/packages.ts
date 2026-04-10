import {
  pgTable,
  text,
  integer,
  real,
  timestamp,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { salesOrders, salesOrderLines } from "./sales-orders";

export const packages = pgTable("packages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  salesOrderId: text("sales_order_id")
    .notNull()
    .references(() => salesOrders.id, { onDelete: "cascade" }),
  label: text("label"),
  weightKg: real("weight_kg"),
  lengthCm: real("length_cm"),
  widthCm: real("width_cm"),
  heightCm: real("height_cm"),
  trackingNumber: text("tracking_number"),
  carrier: text("carrier"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const packageItems = pgTable("package_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  packageId: text("package_id")
    .notNull()
    .references(() => packages.id, { onDelete: "cascade" }),
  salesOrderLineId: text("sales_order_line_id")
    .notNull()
    .references(() => salesOrderLines.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
});
