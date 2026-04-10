import { z } from "zod";
import {
  CARRIERS,
  ORDER_STATUSES,
  PO_STATUSES,
  LOCATION_TYPES,
  LOCATION_CAPACITIES,
} from "../constants/index";

export const productSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  barcode: z.string().optional(),
  unitOfMeasure: z.string().default("unit"),
  weightKg: z.number().nonnegative().optional(),
  volumeM3: z.number().nonnegative().optional(),
  lowStockThreshold: z.number().int().nonnegative().default(5),
  active: z.boolean().default(true),
});

export const createProductSchema = productSchema.omit({ id: true, tenantId: true });

export const locationSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1),
  barcode: z.string().min(1),
  row: z.string().optional(),
  bay: z.number().int().optional(),
  level: z.number().int().optional(),
  bin: z.number().int().optional(),
  capacity: z.enum(LOCATION_CAPACITIES).default("single_pallet"),
  efficiency: z.number().int().min(1).max(5).default(5),
  locationType: z.enum(LOCATION_TYPES).default("rack"),
  active: z.boolean().default(true),
});

export const createLocationSchema = locationSchema.omit({ id: true, tenantId: true });

export const salesOrderSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  orderNumber: z.string().min(1),
  customerName: z.string().min(1),
  shippingAddress: z.object({
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postcode: z.string(),
    country: z.string().default("AU"),
  }),
  carrier: z.enum(CARRIERS),
  shippingService: z.string().optional(),
  status: z.enum(ORDER_STATUSES).default("draft"),
  source: z.enum(["manual", "shopify", "csv", "api"]).default("manual"),
  externalId: z.string().optional(),
});

export const purchaseOrderSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  supplierName: z.string().min(1),
  status: z.enum(PO_STATUSES).default("draft"),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
});

export type Product = z.infer<typeof productSchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type Location = z.infer<typeof locationSchema>;
export type CreateLocation = z.infer<typeof createLocationSchema>;
export type SalesOrder = z.infer<typeof salesOrderSchema>;
export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;
