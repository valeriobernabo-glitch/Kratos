import { db } from "@kratos/db";
import {
  salesOrders,
  salesOrderLines,
  stockAllocations,
  products,
  inventory,
  locations,
} from "@kratos/db/schema";
import { eq, and, sql, desc, asc, inArray } from "@kratos/db/orm";

type Carrier = "auspost" | "tge" | "toll" | "allied_express" | "tnt" | "other";
type SOStatus =
  | "draft"
  | "awaiting_pick"
  | "picking"
  | "awaiting_pack"
  | "packing"
  | "packed"
  | "shipped"
  | "cancelled";

export async function listSalesOrders({
  tenantId,
  status,
  carrier,
  page = 1,
  pageSize = 20,
}: {
  tenantId: string;
  status?: string;
  carrier?: string;
  page?: number;
  pageSize?: number;
}) {
  const conditions = [eq(salesOrders.tenantId, tenantId)];

  if (status) {
    conditions.push(eq(salesOrders.status, status as SOStatus));
  }
  if (carrier) {
    conditions.push(eq(salesOrders.carrier, carrier as Carrier));
  }

  const where = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(salesOrders)
      .where(where)
      .orderBy(desc(salesOrders.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(salesOrders)
      .where(where),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    data: items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getSalesOrder(tenantId: string, id: string) {
  const [so] = await db
    .select()
    .from(salesOrders)
    .where(and(eq(salesOrders.id, id), eq(salesOrders.tenantId, tenantId)));

  if (!so) return null;

  const lines = await db
    .select({
      id: salesOrderLines.id,
      productId: salesOrderLines.productId,
      orderedQty: salesOrderLines.orderedQty,
      allocatedQty: salesOrderLines.allocatedQty,
      pickedQty: salesOrderLines.pickedQty,
      packedQty: salesOrderLines.packedQty,
      productName: products.name,
      productSku: products.sku,
      productBarcode: products.barcode,
    })
    .from(salesOrderLines)
    .innerJoin(products, eq(salesOrderLines.productId, products.id))
    .where(eq(salesOrderLines.salesOrderId, id));

  const allocations = lines.length
    ? await db
        .select({
          id: stockAllocations.id,
          salesOrderLineId: stockAllocations.salesOrderLineId,
          inventoryId: stockAllocations.inventoryId,
          quantity: stockAllocations.quantity,
          locationId: inventory.locationId,
          locationName: locations.name,
          locationBarcode: locations.barcode,
        })
        .from(stockAllocations)
        .innerJoin(inventory, eq(stockAllocations.inventoryId, inventory.id))
        .innerJoin(locations, eq(inventory.locationId, locations.id))
        .where(
          inArray(
            stockAllocations.salesOrderLineId,
            lines.map((l) => l.id),
          ),
        )
    : [];

  return { ...so, lines, allocations };
}

function generateOrderNumber() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SO-${yyyy}${mm}${dd}-${rand}`;
}

export async function createSalesOrder(
  tenantId: string,
  data: {
    orderNumber?: string;
    customerName: string;
    carrier: Carrier;
    shippingService?: string;
    shippingAddress?: Record<string, unknown>;
    source?: "manual" | "shopify" | "csv" | "api";
    externalId?: string;
    lines: Array<{ productId: string; orderedQty: number }>;
  },
) {
  return await db.transaction(async (tx) => {
    const [so] = await tx
      .insert(salesOrders)
      .values({
        tenantId,
        orderNumber: data.orderNumber ?? generateOrderNumber(),
        customerName: data.customerName,
        carrier: data.carrier,
        shippingService: data.shippingService,
        shippingAddress: data.shippingAddress,
        source: data.source ?? "manual",
        externalId: data.externalId,
        status: "draft",
      })
      .returning();

    if (data.lines.length > 0) {
      await tx.insert(salesOrderLines).values(
        data.lines.map((line) => ({
          salesOrderId: so!.id,
          productId: line.productId,
          orderedQty: line.orderedQty,
        })),
      );
    }

    return so;
  });
}

/**
 * Allocate stock to every line of this SO using FIFO (oldest inventory first).
 * Creates stock_allocations rows and updates allocated_qty on each line.
 * Moves status from draft -> awaiting_pick if allocation is complete for all lines.
 * Short allocations are allowed (allocated < ordered) — caller decides what to do.
 */
export async function allocateStock(tenantId: string, soId: string) {
  return await db.transaction(async (tx) => {
    const [so] = await tx
      .select()
      .from(salesOrders)
      .where(and(eq(salesOrders.id, soId), eq(salesOrders.tenantId, tenantId)));

    if (!so) return null;
    if (so.status !== "draft") return so;

    const lines = await tx
      .select()
      .from(salesOrderLines)
      .where(eq(salesOrderLines.salesOrderId, soId));

    let fullyAllocated = true;

    for (const line of lines) {
      // Skip if already allocated
      if (line.allocatedQty >= line.orderedQty) continue;

      const needed = line.orderedQty - line.allocatedQty;

      // How much of this product is already allocated across ALL SOs (not yet picked)?
      const [{ allocated = 0 } = { allocated: 0 }] = await tx
        .select({
          allocated: sql<number>`coalesce(sum(${stockAllocations.quantity}), 0)`,
        })
        .from(stockAllocations)
        .innerJoin(
          inventory,
          eq(stockAllocations.inventoryId, inventory.id),
        )
        .where(
          and(
            eq(stockAllocations.tenantId, tenantId),
            eq(inventory.productId, line.productId),
          ),
        );

      // Pull inventory rows for this product (FIFO by updatedAt)
      const invRows = await tx
        .select()
        .from(inventory)
        .where(
          and(
            eq(inventory.tenantId, tenantId),
            eq(inventory.productId, line.productId),
          ),
        )
        .orderBy(asc(inventory.updatedAt));

      let remaining = needed;
      let runningAllocatedForProduct = Number(allocated);

      for (const inv of invRows) {
        if (remaining <= 0) break;

        // Per-inventory-row: how much is already allocated from this specific row?
        const [{ used = 0 } = { used: 0 }] = await tx
          .select({
            used: sql<number>`coalesce(sum(${stockAllocations.quantity}), 0)`,
          })
          .from(stockAllocations)
          .where(eq(stockAllocations.inventoryId, inv.id));

        const available = inv.quantity - Number(used);
        if (available <= 0) continue;

        const take = Math.min(available, remaining);

        await tx.insert(stockAllocations).values({
          tenantId,
          salesOrderLineId: line.id,
          inventoryId: inv.id,
          quantity: take,
        });

        remaining -= take;
        runningAllocatedForProduct += take;
      }

      const allocatedThisLine = needed - remaining;
      if (allocatedThisLine > 0) {
        await tx
          .update(salesOrderLines)
          .set({
            allocatedQty: sql`${salesOrderLines.allocatedQty} + ${allocatedThisLine}`,
          })
          .where(eq(salesOrderLines.id, line.id));
      }

      if (remaining > 0) fullyAllocated = false;
    }

    if (fullyAllocated && lines.length > 0) {
      const [updated] = await tx
        .update(salesOrders)
        .set({ status: "awaiting_pick" })
        .where(eq(salesOrders.id, soId))
        .returning();
      return updated;
    }

    return so;
  });
}

/**
 * Release all stock allocations for this SO (returns to draft).
 */
export async function releaseStock(tenantId: string, soId: string) {
  return await db.transaction(async (tx) => {
    const lines = await tx
      .select({ id: salesOrderLines.id })
      .from(salesOrderLines)
      .where(eq(salesOrderLines.salesOrderId, soId));

    const lineIds = lines.map((l) => l.id);
    if (lineIds.length === 0) return null;

    await tx
      .delete(stockAllocations)
      .where(
        and(
          eq(stockAllocations.tenantId, tenantId),
          inArray(stockAllocations.salesOrderLineId, lineIds),
        ),
      );

    await tx
      .update(salesOrderLines)
      .set({ allocatedQty: 0 })
      .where(inArray(salesOrderLines.id, lineIds));

    const [so] = await tx
      .update(salesOrders)
      .set({ status: "draft" })
      .where(and(eq(salesOrders.id, soId), eq(salesOrders.tenantId, tenantId)))
      .returning();

    return so ?? null;
  });
}

/**
 * Generate a pick list for a single sales order from its stock allocations.
 * Groups by (product, location) and sorts by location name for path efficiency.
 * Location naming (e.g. A-01-L1-B1) sorts alphabetically into a sensible walking path.
 */
export async function getPickListForOrder(tenantId: string, soId: string) {
  const [so] = await db
    .select()
    .from(salesOrders)
    .where(and(eq(salesOrders.id, soId), eq(salesOrders.tenantId, tenantId)));

  if (!so) return null;

  const lineIds = (
    await db
      .select({ id: salesOrderLines.id })
      .from(salesOrderLines)
      .where(eq(salesOrderLines.salesOrderId, soId))
  ).map((r) => r.id);

  if (lineIds.length === 0) {
    return { order: so, tasks: [] as Array<never> };
  }

  const rows = await db
    .select({
      productId: inventory.productId,
      locationId: inventory.locationId,
      productName: products.name,
      productSku: products.sku,
      productBarcode: products.barcode,
      locationName: locations.name,
      locationBarcode: locations.barcode,
      quantity: sql<number>`sum(${stockAllocations.quantity})`,
    })
    .from(stockAllocations)
    .innerJoin(inventory, eq(stockAllocations.inventoryId, inventory.id))
    .innerJoin(products, eq(inventory.productId, products.id))
    .innerJoin(locations, eq(inventory.locationId, locations.id))
    .where(inArray(stockAllocations.salesOrderLineId, lineIds))
    .groupBy(
      inventory.productId,
      inventory.locationId,
      products.name,
      products.sku,
      products.barcode,
      locations.name,
      locations.barcode,
    )
    .orderBy(asc(locations.name));

  const tasks = rows.map((r) => ({
    ...r,
    quantity: Number(r.quantity),
  }));

  return { order: so, tasks };
}

export async function updateSalesOrderStatus(
  tenantId: string,
  id: string,
  status: SOStatus,
) {
  const [so] = await db
    .update(salesOrders)
    .set({ status })
    .where(and(eq(salesOrders.id, id), eq(salesOrders.tenantId, tenantId)))
    .returning();

  return so ?? null;
}

export async function cancelSalesOrder(tenantId: string, id: string) {
  return await db.transaction(async (tx) => {
    const lineIds = (
      await tx
        .select({ id: salesOrderLines.id })
        .from(salesOrderLines)
        .where(eq(salesOrderLines.salesOrderId, id))
    ).map((l) => l.id);

    if (lineIds.length > 0) {
      await tx
        .delete(stockAllocations)
        .where(
          and(
            eq(stockAllocations.tenantId, tenantId),
            inArray(stockAllocations.salesOrderLineId, lineIds),
          ),
        );

      await tx
        .update(salesOrderLines)
        .set({ allocatedQty: 0 })
        .where(inArray(salesOrderLines.id, lineIds));
    }

    const [so] = await tx
      .update(salesOrders)
      .set({ status: "cancelled" })
      .where(and(eq(salesOrders.id, id), eq(salesOrders.tenantId, tenantId)))
      .returning();

    return so ?? null;
  });
}

export async function deleteSalesOrder(tenantId: string, id: string) {
  const [so] = await db
    .delete(salesOrders)
    .where(
      and(
        eq(salesOrders.id, id),
        eq(salesOrders.tenantId, tenantId),
        eq(salesOrders.status, "draft"),
      ),
    )
    .returning();

  return so ?? null;
}
