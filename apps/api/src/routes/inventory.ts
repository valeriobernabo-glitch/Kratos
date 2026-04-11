import { Hono } from "hono";
import {
  getStockOnHand,
  getStockSummary,
  adjustStock,
  getStockMovements,
} from "../services/inventory";

const TEMP_TENANT_ID = "default-tenant";

export const inventoryRoutes = new Hono()
  .get("/inventory", async (c) => {
    const { productId, locationId, page, pageSize } = c.req.query();

    const result = await getStockOnHand({
      tenantId: TEMP_TENANT_ID,
      productId: productId || undefined,
      locationId: locationId || undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });

    return c.json(result);
  })
  .get("/inventory/summary", async (c) => {
    const summary = await getStockSummary(TEMP_TENANT_ID);
    return c.json({ data: summary });
  })
  .post("/inventory/adjust", async (c) => {
    const body = await c.req.json();

    const { productId, locationId, quantity, notes } = body as {
      productId: string;
      locationId: string;
      quantity: number;
      notes?: string;
    };

    if (!productId || !locationId || quantity === undefined) {
      return c.json(
        { error: "validation_error", message: "productId, locationId, and quantity are required" },
        400,
      );
    }

    const movement = await adjustStock({
      tenantId: TEMP_TENANT_ID,
      productId,
      locationId,
      quantity,
      movementType: "adjust",
      notes,
    });

    return c.json({ data: movement }, 201);
  })
  .get("/inventory/movements", async (c) => {
    const { productId, page, pageSize } = c.req.query();

    const result = await getStockMovements({
      tenantId: TEMP_TENANT_ID,
      productId: productId || undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });

    return c.json(result);
  });
