import { Hono } from "hono";
import {
  listSalesOrders,
  getSalesOrder,
  createSalesOrder,
  allocateStock,
  releaseStock,
  updateSalesOrderStatus,
  cancelSalesOrder,
  deleteSalesOrder,
  getPickListForOrder,
} from "../services/sales-orders";
import {
  packSalesOrder,
  shipSalesOrder,
  getPackagesForOrder,
} from "../services/packing";

const TEMP_TENANT_ID = "default-tenant";

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

const VALID_CARRIERS: Carrier[] = [
  "auspost",
  "tge",
  "toll",
  "allied_express",
  "tnt",
  "other",
];

export const salesOrderRoutes = new Hono()
  .get("/sales-orders", async (c) => {
    const { status, carrier, page, pageSize } = c.req.query();

    const result = await listSalesOrders({
      tenantId: TEMP_TENANT_ID,
      status: status || undefined,
      carrier: carrier || undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });

    return c.json(result);
  })
  .get("/sales-orders/:id/pick-list", async (c) => {
    const result = await getPickListForOrder(
      TEMP_TENANT_ID,
      c.req.param("id"),
    );

    if (!result) {
      return c.json(
        { error: "not_found", message: "Sales order not found" },
        404,
      );
    }

    return c.json({ data: result });
  })
  .get("/sales-orders/:id", async (c) => {
    const so = await getSalesOrder(TEMP_TENANT_ID, c.req.param("id"));

    if (!so) {
      return c.json({ error: "not_found", message: "Sales order not found" }, 404);
    }

    return c.json({ data: so });
  })
  .post("/sales-orders", async (c) => {
    const body = await c.req.json();

    const {
      orderNumber,
      customerName,
      carrier,
      shippingService,
      shippingAddress,
      source,
      externalId,
      lines,
    } = body as {
      orderNumber?: string;
      customerName: string;
      carrier: Carrier;
      shippingService?: string;
      shippingAddress?: Record<string, unknown>;
      source?: "manual" | "shopify" | "csv" | "api";
      externalId?: string;
      lines: Array<{ productId: string; orderedQty: number }>;
    };

    if (!customerName || !carrier || !lines || lines.length === 0) {
      return c.json(
        {
          error: "validation_error",
          message: "customerName, carrier, and at least one line are required",
        },
        400,
      );
    }

    if (!VALID_CARRIERS.includes(carrier)) {
      return c.json(
        {
          error: "validation_error",
          message: `carrier must be one of: ${VALID_CARRIERS.join(", ")}`,
        },
        400,
      );
    }

    const so = await createSalesOrder(TEMP_TENANT_ID, {
      orderNumber,
      customerName,
      carrier,
      shippingService,
      shippingAddress,
      source,
      externalId,
      lines,
    });

    return c.json({ data: so }, 201);
  })
  .post("/sales-orders/:id/allocate", async (c) => {
    const so = await allocateStock(TEMP_TENANT_ID, c.req.param("id"));

    if (!so) {
      return c.json({ error: "not_found", message: "Sales order not found" }, 404);
    }

    return c.json({ data: so });
  })
  .post("/sales-orders/:id/release", async (c) => {
    const so = await releaseStock(TEMP_TENANT_ID, c.req.param("id"));

    if (!so) {
      return c.json({ error: "not_found", message: "Sales order not found" }, 404);
    }

    return c.json({ data: so });
  })
  .put("/sales-orders/:id/status", async (c) => {
    const body = await c.req.json();
    const { status } = body as { status: SOStatus };

    const so = await updateSalesOrderStatus(
      TEMP_TENANT_ID,
      c.req.param("id"),
      status,
    );

    if (!so) {
      return c.json({ error: "not_found", message: "Sales order not found" }, 404);
    }

    return c.json({ data: so });
  })
  .post("/sales-orders/:id/cancel", async (c) => {
    const so = await cancelSalesOrder(TEMP_TENANT_ID, c.req.param("id"));

    if (!so) {
      return c.json({ error: "not_found", message: "Sales order not found" }, 404);
    }

    return c.json({ data: so });
  })
  .post("/sales-orders/:id/pack", async (c) => {
    const body = await c.req.json().catch(() => ({}));

    try {
      const so = await packSalesOrder(
        TEMP_TENANT_ID,
        c.req.param("id"),
        body as {
          packages?: Array<{
            label?: string;
            weightKg?: number;
            lengthCm?: number;
            widthCm?: number;
            heightCm?: number;
            items?: Array<{ lineId: string; quantity: number }>;
          }>;
        },
      );

      if (!so) {
        return c.json(
          { error: "not_found", message: "Sales order not found" },
          404,
        );
      }

      return c.json({ data: so });
    } catch (err) {
      return c.json(
        {
          error: "validation_error",
          message: err instanceof Error ? err.message : "Failed to pack",
        },
        400,
      );
    }
  })
  .post("/sales-orders/:id/ship", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { trackingNumber } = body as { trackingNumber?: string };

    try {
      const so = await shipSalesOrder(TEMP_TENANT_ID, c.req.param("id"), {
        trackingNumber,
      });

      if (!so) {
        return c.json(
          { error: "not_found", message: "Sales order not found" },
          404,
        );
      }

      return c.json({ data: so });
    } catch (err) {
      return c.json(
        {
          error: "validation_error",
          message: err instanceof Error ? err.message : "Failed to ship",
        },
        400,
      );
    }
  })
  .get("/sales-orders/:id/packages", async (c) => {
    const result = await getPackagesForOrder(
      TEMP_TENANT_ID,
      c.req.param("id"),
    );

    if (result === null) {
      return c.json(
        { error: "not_found", message: "Sales order not found" },
        404,
      );
    }

    return c.json({ data: result });
  })
  .delete("/sales-orders/:id", async (c) => {
    const so = await deleteSalesOrder(TEMP_TENANT_ID, c.req.param("id"));

    if (!so) {
      return c.json(
        {
          error: "not_found",
          message: "Sales order not found or not in draft status",
        },
        404,
      );
    }

    return c.json({ data: so });
  });
