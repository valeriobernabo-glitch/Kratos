import { db } from "@kratos/db";
import {
  wavePicks,
  wavePickOrders,
  wavePickItems,
  salesOrders,
  salesOrderLines,
  stockAllocations,
  inventory,
  locations,
  products,
  stockMovements,
} from "@kratos/db/schema";
import { eq, and, sql, desc, inArray } from "@kratos/db/orm";

type Carrier = "auspost" | "tge" | "toll" | "allied_express" | "tnt" | "other";

export async function listWavePicks({
  tenantId,
  status,
  page = 1,
  pageSize = 20,
}: {
  tenantId: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const conditions = [eq(wavePicks.tenantId, tenantId)];

  if (status) {
    conditions.push(
      eq(wavePicks.status, status as "created" | "in_progress" | "completed"),
    );
  }

  const where = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: wavePicks.id,
        carrier: wavePicks.carrier,
        status: wavePicks.status,
        createdAt: wavePicks.createdAt,
        completedAt: wavePicks.completedAt,
        orderCount: sql<number>`(SELECT count(*) FROM wave_pick_orders WHERE wave_pick_orders.wave_pick_id = ${wavePicks.id})`,
        itemCount: sql<number>`(SELECT coalesce(sum(total_qty), 0) FROM wave_pick_items WHERE wave_pick_items.wave_pick_id = ${wavePicks.id})`,
        pickedCount: sql<number>`(SELECT coalesce(sum(picked_qty), 0) FROM wave_pick_items WHERE wave_pick_items.wave_pick_id = ${wavePicks.id})`,
      })
      .from(wavePicks)
      .where(where)
      .orderBy(desc(wavePicks.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(wavePicks)
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

export async function getWavePick(tenantId: string, id: string) {
  const [wp] = await db
    .select()
    .from(wavePicks)
    .where(and(eq(wavePicks.id, id), eq(wavePicks.tenantId, tenantId)));

  if (!wp) return null;

  const orders = await db
    .select({
      id: salesOrders.id,
      orderNumber: salesOrders.orderNumber,
      customerName: salesOrders.customerName,
      status: salesOrders.status,
    })
    .from(wavePickOrders)
    .innerJoin(salesOrders, eq(wavePickOrders.salesOrderId, salesOrders.id))
    .where(eq(wavePickOrders.wavePickId, id));

  const items = await db
    .select({
      id: wavePickItems.id,
      productId: wavePickItems.productId,
      locationId: wavePickItems.locationId,
      totalQty: wavePickItems.totalQty,
      pickedQty: wavePickItems.pickedQty,
      productName: products.name,
      productSku: products.sku,
      productBarcode: products.barcode,
      locationName: locations.name,
      locationBarcode: locations.barcode,
    })
    .from(wavePickItems)
    .innerJoin(products, eq(wavePickItems.productId, products.id))
    .innerJoin(locations, eq(wavePickItems.locationId, locations.id))
    .where(eq(wavePickItems.wavePickId, id))
    .orderBy(locations.name);

  return { ...wp, orders, items };
}

/**
 * Get sales orders that are candidates for a wave pick:
 * - status = awaiting_pick
 * - matching carrier (if specified)
 * - not already assigned to an open wave pick
 */
export async function getWaveCandidates(tenantId: string, carrier?: Carrier) {
  const conditions = [
    eq(salesOrders.tenantId, tenantId),
    eq(salesOrders.status, "awaiting_pick"),
  ];

  if (carrier) {
    conditions.push(eq(salesOrders.carrier, carrier));
  }

  // Find SO ids that are in an open wave
  const busySOIds = await db
    .select({ id: wavePickOrders.salesOrderId })
    .from(wavePickOrders)
    .innerJoin(wavePicks, eq(wavePickOrders.wavePickId, wavePicks.id))
    .where(
      and(
        eq(wavePicks.tenantId, tenantId),
        inArray(wavePicks.status, ["created", "in_progress"]),
      ),
    );

  const busyIds = busySOIds.map((r) => r.id);

  const rows = await db
    .select({
      id: salesOrders.id,
      orderNumber: salesOrders.orderNumber,
      customerName: salesOrders.customerName,
      carrier: salesOrders.carrier,
      createdAt: salesOrders.createdAt,
      lineCount: sql<number>`(SELECT count(*) FROM sales_order_lines WHERE sales_order_lines.sales_order_id = ${salesOrders.id})`,
      totalQty: sql<number>`(SELECT coalesce(sum(ordered_qty), 0) FROM sales_order_lines WHERE sales_order_lines.sales_order_id = ${salesOrders.id})`,
    })
    .from(salesOrders)
    .where(and(...conditions))
    .orderBy(desc(salesOrders.createdAt));

  return rows.filter((r) => !busyIds.includes(r.id));
}

/**
 * Create a wave pick from a list of sales order IDs.
 * Consolidates all allocations across those orders into wave_pick_items
 * grouped by (product, location). Bumps SO status to "picking".
 */
export async function createWavePick(
  tenantId: string,
  data: { carrier: Carrier; salesOrderIds: string[]; createdBy?: string },
) {
  if (data.salesOrderIds.length === 0) return null;

  return await db.transaction(async (tx) => {
    // Verify all SOs belong to tenant, are awaiting_pick, and match carrier
    const sos = await tx
      .select()
      .from(salesOrders)
      .where(
        and(
          eq(salesOrders.tenantId, tenantId),
          inArray(salesOrders.id, data.salesOrderIds),
        ),
      );

    if (sos.length !== data.salesOrderIds.length) {
      throw new Error("Some sales orders were not found");
    }

    for (const so of sos) {
      if (so.carrier !== data.carrier) {
        throw new Error(
          `Sales order ${so.orderNumber} has carrier ${so.carrier}, expected ${data.carrier}`,
        );
      }
      if (so.status !== "awaiting_pick") {
        throw new Error(
          `Sales order ${so.orderNumber} is not in awaiting_pick status (is ${so.status})`,
        );
      }
    }

    const [wave] = await tx
      .insert(wavePicks)
      .values({
        tenantId,
        carrier: data.carrier,
        status: "created",
        createdBy: data.createdBy,
      })
      .returning();

    await tx.insert(wavePickOrders).values(
      data.salesOrderIds.map((soId) => ({
        wavePickId: wave!.id,
        salesOrderId: soId,
      })),
    );

    // Pull all allocations across the selected SO lines, grouped by (product, location)
    const lineIds = (
      await tx
        .select({ id: salesOrderLines.id })
        .from(salesOrderLines)
        .where(inArray(salesOrderLines.salesOrderId, data.salesOrderIds))
    ).map((r) => r.id);

    if (lineIds.length > 0) {
      const rows = await tx
        .select({
          productId: inventory.productId,
          locationId: inventory.locationId,
          quantity: sql<number>`sum(${stockAllocations.quantity})`,
        })
        .from(stockAllocations)
        .innerJoin(inventory, eq(stockAllocations.inventoryId, inventory.id))
        .where(inArray(stockAllocations.salesOrderLineId, lineIds))
        .groupBy(inventory.productId, inventory.locationId);

      if (rows.length > 0) {
        await tx.insert(wavePickItems).values(
          rows.map((r) => ({
            wavePickId: wave!.id,
            productId: r.productId,
            locationId: r.locationId,
            totalQty: Number(r.quantity),
          })),
        );
      }
    }

    // Move SOs to picking
    await tx
      .update(salesOrders)
      .set({ status: "picking" })
      .where(inArray(salesOrders.id, data.salesOrderIds));

    return wave;
  });
}

/**
 * Record a pick on a wave pick item. Updates picked_qty.
 */
export async function pickWaveItem(
  tenantId: string,
  waveId: string,
  itemId: string,
  pickedQty: number,
  userId?: string,
) {
  return await db.transaction(async (tx) => {
    const [wave] = await tx
      .select()
      .from(wavePicks)
      .where(and(eq(wavePicks.id, waveId), eq(wavePicks.tenantId, tenantId)));

    if (!wave) return null;

    if (wave.status === "created") {
      await tx
        .update(wavePicks)
        .set({ status: "in_progress" })
        .where(eq(wavePicks.id, waveId));
    }

    const [item] = await tx
      .update(wavePickItems)
      .set({
        pickedQty,
        pickedBy: userId,
        pickedAt: new Date(),
      })
      .where(
        and(eq(wavePickItems.id, itemId), eq(wavePickItems.wavePickId, waveId)),
      )
      .returning();

    return item ?? null;
  });
}

/**
 * Complete a wave pick: apply picks to inventory (decrement), split back into
 * individual SOs (update picked_qty on each line), bump SO status to awaiting_pack,
 * and close the wave.
 */
export async function completeWavePick(tenantId: string, waveId: string) {
  return await db.transaction(async (tx) => {
    const [wave] = await tx
      .select()
      .from(wavePicks)
      .where(and(eq(wavePicks.id, waveId), eq(wavePicks.tenantId, tenantId)));

    if (!wave) return null;
    if (wave.status === "completed") return wave;

    const items = await tx
      .select()
      .from(wavePickItems)
      .where(eq(wavePickItems.wavePickId, waveId));

    // Decrement inventory and record stock movements
    for (const item of items) {
      if (item.pickedQty <= 0) continue;

      await tx
        .update(inventory)
        .set({
          quantity: sql`${inventory.quantity} - ${item.pickedQty}`,
        })
        .where(
          and(
            eq(inventory.tenantId, tenantId),
            eq(inventory.productId, item.productId),
            eq(inventory.locationId, item.locationId),
          ),
        );

      await tx.insert(stockMovements).values({
        tenantId,
        productId: item.productId,
        fromLocationId: item.locationId,
        quantity: item.pickedQty,
        movementType: "pick",
        referenceType: "wave_pick",
        referenceId: waveId,
      });
    }

    // Split picks back into individual sales order lines (proportionally by allocation)
    const waveSOIds = (
      await tx
        .select({ id: wavePickOrders.salesOrderId })
        .from(wavePickOrders)
        .where(eq(wavePickOrders.wavePickId, waveId))
    ).map((r) => r.id);

    const soLines = await tx
      .select({
        id: salesOrderLines.id,
        salesOrderId: salesOrderLines.salesOrderId,
        productId: salesOrderLines.productId,
        orderedQty: salesOrderLines.orderedQty,
        allocatedQty: salesOrderLines.allocatedQty,
      })
      .from(salesOrderLines)
      .where(inArray(salesOrderLines.salesOrderId, waveSOIds));

    // For each line, set picked_qty = allocated_qty (assuming wave completed what was allocated)
    for (const line of soLines) {
      await tx
        .update(salesOrderLines)
        .set({ pickedQty: line.allocatedQty })
        .where(eq(salesOrderLines.id, line.id));
    }

    // Delete the stock allocations (stock has been physically picked)
    const lineIds = soLines.map((l) => l.id);
    if (lineIds.length > 0) {
      await tx
        .delete(stockAllocations)
        .where(inArray(stockAllocations.salesOrderLineId, lineIds));
    }

    // Bump SOs to awaiting_pack
    if (waveSOIds.length > 0) {
      await tx
        .update(salesOrders)
        .set({ status: "awaiting_pack" })
        .where(inArray(salesOrders.id, waveSOIds));
    }

    const [updated] = await tx
      .update(wavePicks)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(wavePicks.id, waveId))
      .returning();

    return updated;
  });
}

/**
 * Cancel a wave pick: release SOs back to awaiting_pick, delete the wave.
 */
export async function cancelWavePick(tenantId: string, waveId: string) {
  return await db.transaction(async (tx) => {
    const [wave] = await tx
      .select()
      .from(wavePicks)
      .where(and(eq(wavePicks.id, waveId), eq(wavePicks.tenantId, tenantId)));

    if (!wave) return null;
    if (wave.status === "completed") return null;

    const soIds = (
      await tx
        .select({ id: wavePickOrders.salesOrderId })
        .from(wavePickOrders)
        .where(eq(wavePickOrders.wavePickId, waveId))
    ).map((r) => r.id);

    if (soIds.length > 0) {
      await tx
        .update(salesOrders)
        .set({ status: "awaiting_pick" })
        .where(inArray(salesOrders.id, soIds));
    }

    await tx.delete(wavePicks).where(eq(wavePicks.id, waveId));

    return wave;
  });
}
