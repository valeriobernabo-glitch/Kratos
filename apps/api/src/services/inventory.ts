import { db } from "@kratos/db";
import { inventory, stockMovements, products, locations } from "@kratos/db/schema";
import { eq, and, sql, desc } from "@kratos/db/orm";

export async function getStockOnHand({
  tenantId,
  productId,
  locationId,
  page = 1,
  pageSize = 50,
}: {
  tenantId: string;
  productId?: string;
  locationId?: string;
  page?: number;
  pageSize?: number;
}) {
  const conditions = [eq(inventory.tenantId, tenantId)];

  if (productId) {
    conditions.push(eq(inventory.productId, productId));
  }
  if (locationId) {
    conditions.push(eq(inventory.locationId, locationId));
  }

  const where = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: inventory.id,
        productId: inventory.productId,
        locationId: inventory.locationId,
        quantity: inventory.quantity,
        updatedAt: inventory.updatedAt,
        productName: products.name,
        productSku: products.sku,
        productBarcode: products.barcode,
        locationName: locations.name,
        locationBarcode: locations.barcode,
      })
      .from(inventory)
      .innerJoin(products, eq(inventory.productId, products.id))
      .innerJoin(locations, eq(inventory.locationId, locations.id))
      .where(where)
      .orderBy(desc(inventory.updatedAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(inventory)
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

export async function getStockSummary(tenantId: string) {
  const [totalProducts] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(and(eq(products.tenantId, tenantId), eq(products.active, true)));

  const [totalLocations] = await db
    .select({ count: sql<number>`count(*)` })
    .from(locations)
    .where(and(eq(locations.tenantId, tenantId), eq(locations.active, true)));

  const [totalUnits] = await db
    .select({ total: sql<number>`coalesce(sum(quantity), 0)` })
    .from(inventory)
    .where(eq(inventory.tenantId, tenantId));

  const lowStock = await db
    .select({
      productId: products.id,
      productName: products.name,
      productSku: products.sku,
      totalQty: sql<number>`coalesce(sum(${inventory.quantity}), 0)`,
      threshold: products.lowStockThreshold,
    })
    .from(products)
    .leftJoin(inventory, eq(products.id, inventory.productId))
    .where(and(eq(products.tenantId, tenantId), eq(products.active, true)))
    .groupBy(products.id, products.name, products.sku, products.lowStockThreshold)
    .having(
      sql`coalesce(sum(${inventory.quantity}), 0) < ${products.lowStockThreshold}`,
    );

  return {
    totalProducts: Number(totalProducts?.count ?? 0),
    totalLocations: Number(totalLocations?.count ?? 0),
    totalUnits: Number(totalUnits?.total ?? 0),
    lowStockCount: lowStock.length,
    lowStockItems: lowStock,
  };
}

export async function adjustStock({
  tenantId,
  productId,
  locationId,
  quantity,
  movementType,
  userId,
  notes,
}: {
  tenantId: string;
  productId: string;
  locationId: string;
  quantity: number;
  movementType: "adjust" | "receive" | "pick" | "transfer" | "stocktake";
  userId?: string;
  notes?: string;
}) {
  return await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(inventory)
      .where(
        and(
          eq(inventory.tenantId, tenantId),
          eq(inventory.productId, productId),
          eq(inventory.locationId, locationId),
        ),
      );

    if (existing.length > 0) {
      await tx
        .update(inventory)
        .set({
          quantity: sql`${inventory.quantity} + ${quantity}`,
        })
        .where(eq(inventory.id, existing[0]!.id));
    } else {
      await tx.insert(inventory).values({
        tenantId,
        productId,
        locationId,
        quantity,
      });
    }

    const [movement] = await tx
      .insert(stockMovements)
      .values({
        tenantId,
        productId,
        toLocationId: quantity > 0 ? locationId : undefined,
        fromLocationId: quantity < 0 ? locationId : undefined,
        quantity: Math.abs(quantity),
        movementType,
        referenceType: "manual",
        userId,
        notes,
      })
      .returning();

    return movement;
  });
}

export async function getStockMovements({
  tenantId,
  productId,
  page = 1,
  pageSize = 50,
}: {
  tenantId: string;
  productId?: string;
  page?: number;
  pageSize?: number;
}) {
  const conditions = [eq(stockMovements.tenantId, tenantId)];

  if (productId) {
    conditions.push(eq(stockMovements.productId, productId));
  }

  const where = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(stockMovements)
      .where(where)
      .orderBy(desc(stockMovements.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(stockMovements)
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
