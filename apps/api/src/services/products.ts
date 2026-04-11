import { db } from "@kratos/db";
import { products } from "@kratos/db/schema";
import { eq, and, ilike, or, sql, desc } from "@kratos/db/orm";

export async function listProducts({
  tenantId,
  search,
  active,
  page = 1,
  pageSize = 50,
}: {
  tenantId: string;
  search?: string;
  active?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const conditions = [eq(products.tenantId, tenantId)];

  if (active !== undefined) {
    conditions.push(eq(products.active, active));
  }

  if (search) {
    conditions.push(
      or(
        ilike(products.name, `%${search}%`),
        ilike(products.sku, `%${search}%`),
        ilike(products.barcode, `%${search}%`),
      )!,
    );
  }

  const where = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(products)
      .where(where)
      .orderBy(desc(products.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
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

export async function getProduct(tenantId: string, id: string) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.tenantId, tenantId)));

  return product ?? null;
}

export async function createProduct(
  tenantId: string,
  data: {
    sku: string;
    name: string;
    description?: string;
    barcode?: string;
    unitOfMeasure?: string;
    weightKg?: number;
    volumeM3?: number;
    lowStockThreshold?: number;
    active?: boolean;
  },
) {
  const [product] = await db
    .insert(products)
    .values({
      tenantId,
      ...data,
    })
    .returning();

  return product;
}

export async function updateProduct(
  tenantId: string,
  id: string,
  data: {
    sku?: string;
    name?: string;
    description?: string;
    barcode?: string;
    unitOfMeasure?: string;
    weightKg?: number;
    volumeM3?: number;
    lowStockThreshold?: number;
    active?: boolean;
  },
) {
  const [product] = await db
    .update(products)
    .set(data)
    .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
    .returning();

  return product ?? null;
}

export async function deleteProduct(tenantId: string, id: string) {
  const [product] = await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.tenantId, tenantId)))
    .returning();

  return product ?? null;
}
