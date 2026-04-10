import {
  pgTable,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";
import { salesOrderLines } from "./sales-orders";
import { products } from "./products";
import { locations } from "./locations";

export const pickLists = pgTable("pick_lists", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  status: text("status", {
    enum: ["created", "in_progress", "completed"],
  })
    .notNull()
    .default("created"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pickListItems = pgTable("pick_list_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  pickListId: text("pick_list_id")
    .notNull()
    .references(() => pickLists.id, { onDelete: "cascade" }),
  salesOrderLineId: text("sales_order_line_id")
    .notNull()
    .references(() => salesOrderLines.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  locationId: text("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  pickedQty: integer("picked_qty").notNull().default(0),
  pickedBy: text("picked_by"),
  pickedAt: timestamp("picked_at", { withTimezone: true }),
});
