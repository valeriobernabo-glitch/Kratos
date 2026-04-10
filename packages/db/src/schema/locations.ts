import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { tenants } from "./tenants";

export const locations = pgTable("locations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  barcode: text("barcode").notNull(),
  row: text("row"),
  bay: integer("bay"),
  level: integer("level"),
  bin: integer("bin"),
  capacity: text("capacity", {
    enum: ["single_pallet", "multiple_pallets"],
  })
    .notNull()
    .default("single_pallet"),
  efficiency: integer("efficiency").notNull().default(5),
  locationType: text("location_type", {
    enum: ["rack", "floor", "office", "receiving", "dispatch"],
  })
    .notNull()
    .default("rack"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
