import { db } from "@kratos/db";
import { locations } from "@kratos/db/schema";
import { eq, and, ilike, or, sql, asc } from "@kratos/db/orm";

export async function listLocations({
  tenantId,
  search,
  row,
  locationType,
  active,
  page = 1,
  pageSize = 100,
}: {
  tenantId: string;
  search?: string;
  row?: string;
  locationType?: string;
  active?: boolean;
  page?: number;
  pageSize?: number;
}) {
  const conditions = [eq(locations.tenantId, tenantId)];

  if (active !== undefined) {
    conditions.push(eq(locations.active, active));
  }

  if (row) {
    conditions.push(eq(locations.row, row));
  }

  if (locationType) {
    conditions.push(eq(locations.locationType, locationType as "rack" | "floor" | "office" | "receiving" | "dispatch"));
  }

  if (search) {
    conditions.push(
      or(
        ilike(locations.name, `%${search}%`),
        ilike(locations.barcode, `%${search}%`),
      )!,
    );
  }

  const where = and(...conditions);
  const offset = (page - 1) * pageSize;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(locations)
      .where(where)
      .orderBy(asc(locations.row), asc(locations.bay), asc(locations.level), asc(locations.bin))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(locations)
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

export async function getLocation(tenantId: string, id: string) {
  const [location] = await db
    .select()
    .from(locations)
    .where(and(eq(locations.id, id), eq(locations.tenantId, tenantId)));

  return location ?? null;
}

export async function createLocation(
  tenantId: string,
  data: {
    name: string;
    barcode: string;
    row?: string;
    bay?: number;
    level?: number;
    bin?: number;
    capacity?: "single_pallet" | "multiple_pallets";
    efficiency?: number;
    locationType?: "rack" | "floor" | "office" | "receiving" | "dispatch";
    active?: boolean;
  },
) {
  const [location] = await db
    .insert(locations)
    .values({
      tenantId,
      ...data,
    })
    .returning();

  return location;
}

export async function createLocationsBulk(
  tenantId: string,
  items: Array<{
    name: string;
    barcode: string;
    row?: string;
    bay?: number;
    level?: number;
    bin?: number;
    capacity?: "single_pallet" | "multiple_pallets";
    efficiency?: number;
    locationType?: "rack" | "floor" | "office" | "receiving" | "dispatch";
  }>,
) {
  const values = items.map((item) => ({
    tenantId,
    ...item,
  }));

  const created = await db.insert(locations).values(values).returning();
  return created;
}

export async function updateLocation(
  tenantId: string,
  id: string,
  data: {
    name?: string;
    barcode?: string;
    row?: string;
    bay?: number;
    level?: number;
    bin?: number;
    capacity?: "single_pallet" | "multiple_pallets";
    efficiency?: number;
    locationType?: "rack" | "floor" | "office" | "receiving" | "dispatch";
    active?: boolean;
  },
) {
  const [location] = await db
    .update(locations)
    .set(data)
    .where(and(eq(locations.id, id), eq(locations.tenantId, tenantId)))
    .returning();

  return location ?? null;
}

export async function deleteLocation(tenantId: string, id: string) {
  const [location] = await db
    .delete(locations)
    .where(and(eq(locations.id, id), eq(locations.tenantId, tenantId)))
    .returning();

  return location ?? null;
}

export function generateRackLocations({
  row,
  bayStart,
  bayEnd,
  levels,
  binsPerLevel,
  efficiency = 5,
}: {
  row: string;
  bayStart: number;
  bayEnd: number;
  levels: number;
  binsPerLevel: number;
  efficiency?: number;
}) {
  const locs: Array<{
    name: string;
    barcode: string;
    row: string;
    bay: number;
    level: number;
    bin: number;
    capacity: "single_pallet";
    efficiency: number;
    locationType: "rack";
  }> = [];

  for (let bay = bayStart; bay <= bayEnd; bay++) {
    for (let level = 1; level <= levels; level++) {
      for (let bin = 1; bin <= binsPerLevel; bin++) {
        const bayStr = bay.toString().padStart(2, "0");
        const name = `${row}-${bayStr}-L${level}-B${bin}`;
        const barcode = `${row}${bayStr}L${level}B${bin}`;
        locs.push({
          name,
          barcode,
          row,
          bay,
          level,
          bin,
          capacity: "single_pallet",
          efficiency,
          locationType: "rack",
        });
      }
    }
  }

  return locs;
}
