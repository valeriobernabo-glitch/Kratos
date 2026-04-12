import { Hono } from "hono";
import {
  listWavePicks,
  getWavePick,
  getWaveCandidates,
  createWavePick,
  pickWaveItem,
  completeWavePick,
  cancelWavePick,
} from "../services/wave-picks";

const TEMP_TENANT_ID = "default-tenant";

type Carrier = "auspost" | "tge" | "toll" | "allied_express" | "tnt" | "other";

const VALID_CARRIERS: Carrier[] = [
  "auspost",
  "tge",
  "toll",
  "allied_express",
  "tnt",
  "other",
];

export const wavePickRoutes = new Hono()
  .get("/wave-picks", async (c) => {
    const { status, page, pageSize } = c.req.query();

    const result = await listWavePicks({
      tenantId: TEMP_TENANT_ID,
      status: status || undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });

    return c.json(result);
  })
  .get("/wave-picks/candidates", async (c) => {
    const { carrier } = c.req.query();

    if (carrier && !VALID_CARRIERS.includes(carrier as Carrier)) {
      return c.json(
        { error: "validation_error", message: "invalid carrier" },
        400,
      );
    }

    const data = await getWaveCandidates(
      TEMP_TENANT_ID,
      carrier as Carrier | undefined,
    );

    return c.json({ data });
  })
  .get("/wave-picks/:id", async (c) => {
    const wp = await getWavePick(TEMP_TENANT_ID, c.req.param("id"));

    if (!wp) {
      return c.json({ error: "not_found", message: "Wave pick not found" }, 404);
    }

    return c.json({ data: wp });
  })
  .post("/wave-picks", async (c) => {
    const body = await c.req.json();
    const { carrier, salesOrderIds, createdBy } = body as {
      carrier: Carrier;
      salesOrderIds: string[];
      createdBy?: string;
    };

    if (!carrier || !VALID_CARRIERS.includes(carrier)) {
      return c.json(
        { error: "validation_error", message: "carrier is required" },
        400,
      );
    }

    if (!Array.isArray(salesOrderIds) || salesOrderIds.length === 0) {
      return c.json(
        { error: "validation_error", message: "salesOrderIds required" },
        400,
      );
    }

    try {
      const wave = await createWavePick(TEMP_TENANT_ID, {
        carrier,
        salesOrderIds,
        createdBy,
      });
      return c.json({ data: wave }, 201);
    } catch (err) {
      return c.json(
        {
          error: "validation_error",
          message: err instanceof Error ? err.message : "Failed to create wave",
        },
        400,
      );
    }
  })
  .put("/wave-picks/:id/items/:itemId/pick", async (c) => {
    const body = await c.req.json();
    const { pickedQty, userId } = body as { pickedQty: number; userId?: string };

    const item = await pickWaveItem(
      TEMP_TENANT_ID,
      c.req.param("id"),
      c.req.param("itemId"),
      pickedQty,
      userId,
    );

    if (!item) {
      return c.json({ error: "not_found", message: "Item not found" }, 404);
    }

    return c.json({ data: item });
  })
  .post("/wave-picks/:id/complete", async (c) => {
    const wave = await completeWavePick(TEMP_TENANT_ID, c.req.param("id"));

    if (!wave) {
      return c.json({ error: "not_found", message: "Wave pick not found" }, 404);
    }

    return c.json({ data: wave });
  })
  .post("/wave-picks/:id/cancel", async (c) => {
    const wave = await cancelWavePick(TEMP_TENANT_ID, c.req.param("id"));

    if (!wave) {
      return c.json(
        {
          error: "not_found",
          message: "Wave pick not found or already completed",
        },
        404,
      );
    }

    return c.json({ data: wave });
  });
