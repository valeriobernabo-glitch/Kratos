import { db } from "@kratos/db";
import {
  salesOrders,
  salesOrderLines,
  packages,
  packageItems,
} from "@kratos/db/schema";
import { eq, and, sql, desc, inArray } from "@kratos/db/orm";

/**
 * Pack a sales order. Simple default: creates one package containing every
 * line at the picked quantity, sets packed_qty = picked_qty on each line,
 * flips SO status to "packed". For per-box tracking, callers can pass
 * explicit `packages` arrays.
 */
export async function packSalesOrder(
  tenantId: string,
  soId: string,
  data?: {
    packages?: Array<{
      label?: string;
      weightKg?: number;
      lengthCm?: number;
      widthCm?: number;
      heightCm?: number;
      items?: Array<{ lineId: string; quantity: number }>;
    }>;
  },
) {
  return await db.transaction(async (tx) => {
    const [so] = await tx
      .select()
      .from(salesOrders)
      .where(and(eq(salesOrders.id, soId), eq(salesOrders.tenantId, tenantId)));

    if (!so) return null;
    if (so.status !== "awaiting_pack" && so.status !== "packing") {
      throw new Error(
        `Cannot pack order in status ${so.status}. Must be awaiting_pack or packing.`,
      );
    }

    const lines = await tx
      .select()
      .from(salesOrderLines)
      .where(eq(salesOrderLines.salesOrderId, soId));

    // Default: one package containing all picked items
    const pkgSpecs =
      data?.packages && data.packages.length > 0
        ? data.packages
        : [
            {
              label: "Package 1",
              items: lines.map((l) => ({
                lineId: l.id,
                quantity: l.pickedQty,
              })),
            },
          ];

    for (const spec of pkgSpecs) {
      const [pkg] = await tx
        .insert(packages)
        .values({
          salesOrderId: soId,
          label: spec.label,
          weightKg: spec.weightKg,
          lengthCm: spec.lengthCm,
          widthCm: spec.widthCm,
          heightCm: spec.heightCm,
          carrier: so.carrier,
        })
        .returning();

      const items = spec.items ?? [];
      if (items.length > 0) {
        await tx.insert(packageItems).values(
          items
            .filter((i) => i.quantity > 0)
            .map((i) => ({
              packageId: pkg!.id,
              salesOrderLineId: i.lineId,
              quantity: i.quantity,
            })),
        );
      }
    }

    // Update packed_qty per line: sum of quantities from package_items across all packages for this SO
    for (const line of lines) {
      const [{ packed = 0 } = { packed: 0 }] = await tx
        .select({
          packed: sql<number>`coalesce(sum(${packageItems.quantity}), 0)`,
        })
        .from(packageItems)
        .innerJoin(packages, eq(packageItems.packageId, packages.id))
        .where(
          and(
            eq(packages.salesOrderId, soId),
            eq(packageItems.salesOrderLineId, line.id),
          ),
        );

      await tx
        .update(salesOrderLines)
        .set({ packedQty: Number(packed) })
        .where(eq(salesOrderLines.id, line.id));
    }

    // If every line has packedQty >= pickedQty (and pickedQty > 0), flip to packed
    const refreshed = await tx
      .select()
      .from(salesOrderLines)
      .where(eq(salesOrderLines.salesOrderId, soId));

    const fullyPacked =
      refreshed.length > 0 &&
      refreshed.every((l) => l.packedQty >= l.pickedQty && l.pickedQty > 0);

    const nextStatus = fullyPacked ? "packed" : "packing";

    const [updated] = await tx
      .update(salesOrders)
      .set({ status: nextStatus })
      .where(eq(salesOrders.id, soId))
      .returning();

    return updated;
  });
}

/**
 * Mark an order as shipped. Records a tracking number (stored on the most
 * recent package for this SO if one exists).
 */
export async function shipSalesOrder(
  tenantId: string,
  soId: string,
  data: { trackingNumber?: string },
) {
  return await db.transaction(async (tx) => {
    const [so] = await tx
      .select()
      .from(salesOrders)
      .where(and(eq(salesOrders.id, soId), eq(salesOrders.tenantId, tenantId)));

    if (!so) return null;
    if (so.status !== "packed") {
      throw new Error(
        `Cannot ship order in status ${so.status}. Must be packed.`,
      );
    }

    if (data.trackingNumber) {
      const pkgs = await tx
        .select()
        .from(packages)
        .where(eq(packages.salesOrderId, soId))
        .orderBy(desc(packages.createdAt))
        .limit(1);

      if (pkgs.length > 0) {
        await tx
          .update(packages)
          .set({ trackingNumber: data.trackingNumber })
          .where(eq(packages.id, pkgs[0]!.id));
      }
    }

    const [updated] = await tx
      .update(salesOrders)
      .set({ status: "shipped" })
      .where(eq(salesOrders.id, soId))
      .returning();

    return updated;
  });
}

/**
 * Return all packages (and their items) for a sales order.
 */
export async function getPackagesForOrder(tenantId: string, soId: string) {
  const [so] = await db
    .select()
    .from(salesOrders)
    .where(and(eq(salesOrders.id, soId), eq(salesOrders.tenantId, tenantId)));

  if (!so) return null;

  const pkgs = await db
    .select()
    .from(packages)
    .where(eq(packages.salesOrderId, soId))
    .orderBy(packages.createdAt);

  if (pkgs.length === 0) return [];

  const items = await db
    .select()
    .from(packageItems)
    .where(
      inArray(
        packageItems.packageId,
        pkgs.map((p) => p.id),
      ),
    );

  return pkgs.map((p) => ({
    ...p,
    items: items.filter((i) => i.packageId === p.id),
  }));
}
