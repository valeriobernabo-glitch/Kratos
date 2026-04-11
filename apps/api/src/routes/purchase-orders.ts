import { Hono } from "hono";
import {
  listPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  receiveLine,
  completeReceiving,
  deletePurchaseOrder,
} from "../services/purchase-orders";

const TEMP_TENANT_ID = "default-tenant";

export const purchaseOrderRoutes = new Hono()
  .get("/purchase-orders", async (c) => {
    const { status, page, pageSize } = c.req.query();

    const result = await listPurchaseOrders({
      tenantId: TEMP_TENANT_ID,
      status: status || undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });

    return c.json(result);
  })
  .get("/purchase-orders/:id", async (c) => {
    const po = await getPurchaseOrder(TEMP_TENANT_ID, c.req.param("id"));

    if (!po) {
      return c.json({ error: "not_found", message: "Purchase order not found" }, 404);
    }

    return c.json({ data: po });
  })
  .post("/purchase-orders", async (c) => {
    const body = await c.req.json();

    const { supplierName, expectedDate, notes, lines } = body as {
      supplierName: string;
      expectedDate?: string;
      notes?: string;
      lines: Array<{ productId: string; expectedQty: number }>;
    };

    if (!supplierName || !lines || lines.length === 0) {
      return c.json(
        { error: "validation_error", message: "supplierName and at least one line are required" },
        400,
      );
    }

    const po = await createPurchaseOrder(TEMP_TENANT_ID, {
      supplierName,
      expectedDate,
      notes,
      lines,
    });

    return c.json({ data: po }, 201);
  })
  .put("/purchase-orders/:id/status", async (c) => {
    const body = await c.req.json();
    const { status } = body as { status: string };

    const po = await updatePurchaseOrderStatus(
      TEMP_TENANT_ID,
      c.req.param("id"),
      status as "draft" | "awaiting_arrival" | "receiving" | "received" | "closed",
    );

    if (!po) {
      return c.json({ error: "not_found", message: "Purchase order not found" }, 404);
    }

    return c.json({ data: po });
  })
  .put("/purchase-orders/:id/lines/:lineId/receive", async (c) => {
    const body = await c.req.json();
    const { receivedQty } = body as { receivedQty: number };

    const line = await receiveLine(
      TEMP_TENANT_ID,
      c.req.param("id"),
      c.req.param("lineId"),
      receivedQty,
    );

    if (!line) {
      return c.json({ error: "not_found", message: "Line not found" }, 404);
    }

    return c.json({ data: line });
  })
  .post("/purchase-orders/:id/complete", async (c) => {
    const body = await c.req.json();
    const { locationId } = body as { locationId: string };

    if (!locationId) {
      return c.json(
        { error: "validation_error", message: "locationId is required (receiving location)" },
        400,
      );
    }

    const po = await completeReceiving(TEMP_TENANT_ID, c.req.param("id"), locationId);

    if (!po) {
      return c.json({ error: "not_found", message: "Purchase order not found" }, 404);
    }

    return c.json({ data: po });
  })
  .delete("/purchase-orders/:id", async (c) => {
    const po = await deletePurchaseOrder(TEMP_TENANT_ID, c.req.param("id"));

    if (!po) {
      return c.json(
        { error: "not_found", message: "Purchase order not found or not in draft status" },
        404,
      );
    }

    return c.json({ data: po });
  });
