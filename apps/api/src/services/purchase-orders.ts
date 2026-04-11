import { db } from "@kratos/db";
import {
  purchaseOrders,
  purchaseOrderLines,
  products,
  inventory,
  stockMovements,
} from "@kratos/db/schema";
import { eq, and, sql, desc } from "@kratos/db/orm";

export async function listPurchaseOrders({
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
  const conditions = [eq(purchaseOrders.tenantId, tenantId)];

  if (status) {
    conditions.push(
      eq(
        purchaseOrders.status,
        status as "draft" | "awaiting_arrival" | "receiving" | "received" | "closed",
      ),
    );
  }

  const where = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(purchaseOrders)
      .where(where)
      .orderBy(desc(purchaseOrders.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(purchaseOrders)
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

export async function getPurchaseOrder(tenantId: string, id: string) {
  const [po] = await db
    .select()
    .from(purchaseOrders)
    .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.tenantId, tenantId)));

  if (!po) return null;

  const lines = await db
    .select({
      id: purchaseOrderLines.id,
      productId: purchaseOrderLines.productId,
      expectedQty: purchaseOrderLines.expectedQty,
      receivedQty: purchaseOrderLines.receivedQty,
      productName: products.name,
      productSku: products.sku,
      productBarcode: products.barcode,
    })
    .from(purchaseOrderLines)
    .innerJoin(products, eq(purchaseOrderLines.productId, products.id))
    .where(eq(purchaseOrderLines.purchaseOrderId, id));

  return { ...po, lines };
}

export async function createPurchaseOrder(
  tenantId: string,
  data: {
    supplierName: string;
    expectedDate?: string;
    notes?: string;
    lines: Array<{ productId: string; expectedQty: number }>;
  },
) {
  return await db.transaction(async (tx) => {
    const [po] = await tx
      .insert(purchaseOrders)
      .values({
        tenantId,
        supplierName: data.supplierName,
        expectedDate: data.expectedDate,
        notes: data.notes,
        status: "draft",
      })
      .returning();

    if (data.lines.length > 0) {
      await tx.insert(purchaseOrderLines).values(
        data.lines.map((line) => ({
          purchaseOrderId: po!.id,
          productId: line.productId,
          expectedQty: line.expectedQty,
        })),
      );
    }

    return po;
  });
}

export async function updatePurchaseOrderStatus(
  tenantId: string,
  id: string,
  status: "draft" | "awaiting_arrival" | "receiving" | "received" | "closed",
) {
  const [po] = await db
    .update(purchaseOrders)
    .set({ status })
    .where(and(eq(purchaseOrders.id, id), eq(purchaseOrders.tenantId, tenantId)))
    .returning();

  return po ?? null;
}

export async function receiveLine(
  tenantId: string,
  poId: string,
  lineId: string,
  receivedQty: number,
) {
  const [po] = await db
    .select()
    .from(purchaseOrders)
    .where(and(eq(purchaseOrders.id, poId), eq(purchaseOrders.tenantId, tenantId)));

  if (!po) return null;

  if (po.status === "draft" || po.status === "awaiting_arrival") {
    await db
      .update(purchaseOrders)
      .set({ status: "receiving" })
      .where(eq(purchaseOrders.id, poId));
  }

  const [line] = await db
    .update(purchaseOrderLines)
    .set({ receivedQty })
    .where(
      and(
        eq(purchaseOrderLines.id, lineId),
        eq(purchaseOrderLines.purchaseOrderId, poId),
      ),
    )
    .returning();

  return line;
}

export async function completeReceiving(tenantId: string, poId: string, locationId: string) {
  return await db.transaction(async (tx) => {
    const lines = await tx
      .select()
      .from(purchaseOrderLines)
      .where(eq(purchaseOrderLines.purchaseOrderId, poId));

    for (const line of lines) {
      if (line.receivedQty <= 0) continue;

      const existing = await tx
        .select()
        .from(inventory)
        .where(
          and(
            eq(inventory.tenantId, tenantId),
            eq(inventory.productId, line.productId),
            eq(inventory.locationId, locationId),
          ),
        );

      if (existing.length > 0) {
        await tx
          .update(inventory)
          .set({
            quantity: sql`${inventory.quantity} + ${line.receivedQty}`,
          })
          .where(eq(inventory.id, existing[0]!.id));
      } else {
        await tx.insert(inventory).values({
          tenantId,
          productId: line.productId,
          locationId,
          quantity: line.receivedQty,
        });
      }

      await tx.insert(stockMovements).values({
        tenantId,
        productId: line.productId,
        toLocationId: locationId,
        quantity: line.receivedQty,
        movementType: "receive",
        referenceType: "purchase_order",
        referenceId: poId,
      });
    }

    const [po] = await tx
      .update(purchaseOrders)
      .set({ status: "received" })
      .where(eq(purchaseOrders.id, poId))
      .returning();

    return po;
  });
}

export async function deletePurchaseOrder(tenantId: string, id: string) {
  const [po] = await db
    .delete(purchaseOrders)
    .where(
      and(
        eq(purchaseOrders.id, id),
        eq(purchaseOrders.tenantId, tenantId),
        eq(purchaseOrders.status, "draft"),
      ),
    )
    .returning();

  return po ?? null;
}
