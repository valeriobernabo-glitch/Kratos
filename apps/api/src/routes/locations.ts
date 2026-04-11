import { Hono } from "hono";
import { createLocationSchema } from "@kratos/shared";
import {
  listLocations,
  getLocation,
  createLocation,
  createLocationsBulk,
  updateLocation,
  deleteLocation,
  generateRackLocations,
} from "../services/locations";

// TODO: Replace hardcoded tenant ID with auth-derived tenant after Better Auth integration
const TEMP_TENANT_ID = "default-tenant";

export const locationRoutes = new Hono()
  .get("/locations", async (c) => {
    const { search, row, locationType, active, page, pageSize } = c.req.query();

    const result = await listLocations({
      tenantId: TEMP_TENANT_ID,
      search: search || undefined,
      row: row || undefined,
      locationType: locationType || undefined,
      active: active !== undefined ? active === "true" : undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });

    return c.json(result);
  })
  .get("/locations/:id", async (c) => {
    const location = await getLocation(TEMP_TENANT_ID, c.req.param("id"));

    if (!location) {
      return c.json({ error: "not_found", message: "Location not found" }, 404);
    }

    return c.json({ data: location });
  })
  .post("/locations", async (c) => {
    const body = await c.req.json();
    const parsed = createLocationSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { error: "validation_error", message: parsed.error.issues[0]?.message ?? "Invalid input" },
        400,
      );
    }

    const location = await createLocation(TEMP_TENANT_ID, parsed.data);
    return c.json({ data: location }, 201);
  })
  .post("/locations/generate", async (c) => {
    const body = await c.req.json();

    const { row, bayStart, bayEnd, levels, binsPerLevel, efficiency } = body as {
      row: string;
      bayStart: number;
      bayEnd: number;
      levels: number;
      binsPerLevel: number;
      efficiency?: number;
    };

    if (!row || !bayStart || !bayEnd || !levels || !binsPerLevel) {
      return c.json(
        { error: "validation_error", message: "row, bayStart, bayEnd, levels, binsPerLevel are required" },
        400,
      );
    }

    const generated = generateRackLocations({
      row,
      bayStart,
      bayEnd,
      levels,
      binsPerLevel,
      efficiency,
    });

    const created = await createLocationsBulk(TEMP_TENANT_ID, generated);
    return c.json({ data: created, count: created.length }, 201);
  })
  .put("/locations/:id", async (c) => {
    const body = await c.req.json();
    const location = await updateLocation(TEMP_TENANT_ID, c.req.param("id"), body);

    if (!location) {
      return c.json({ error: "not_found", message: "Location not found" }, 404);
    }

    return c.json({ data: location });
  })
  .delete("/locations/:id", async (c) => {
    const location = await deleteLocation(TEMP_TENANT_ID, c.req.param("id"));

    if (!location) {
      return c.json({ error: "not_found", message: "Location not found" }, 404);
    }

    return c.json({ data: location });
  });
