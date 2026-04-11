import { Hono } from "hono";
import { createProductSchema } from "@kratos/shared";
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/products";

// TODO: Replace hardcoded tenant ID with auth-derived tenant after Better Auth integration
const TEMP_TENANT_ID = "default-tenant";

export const productRoutes = new Hono()
  .get("/products", async (c) => {
    const { search, active, page, pageSize } = c.req.query();

    const result = await listProducts({
      tenantId: TEMP_TENANT_ID,
      search: search || undefined,
      active: active !== undefined ? active === "true" : undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });

    return c.json(result);
  })
  .get("/products/:id", async (c) => {
    const product = await getProduct(TEMP_TENANT_ID, c.req.param("id"));

    if (!product) {
      return c.json({ error: "not_found", message: "Product not found" }, 404);
    }

    return c.json({ data: product });
  })
  .post("/products", async (c) => {
    const body = await c.req.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        { error: "validation_error", message: parsed.error.issues[0]?.message ?? "Invalid input" },
        400,
      );
    }

    const product = await createProduct(TEMP_TENANT_ID, parsed.data);
    return c.json({ data: product }, 201);
  })
  .put("/products/:id", async (c) => {
    const body = await c.req.json();
    const product = await updateProduct(TEMP_TENANT_ID, c.req.param("id"), body);

    if (!product) {
      return c.json({ error: "not_found", message: "Product not found" }, 404);
    }

    return c.json({ data: product });
  })
  .delete("/products/:id", async (c) => {
    const product = await deleteProduct(TEMP_TENANT_ID, c.req.param("id"));

    if (!product) {
      return c.json({ error: "not_found", message: "Product not found" }, 404);
    }

    return c.json({ data: product });
  });
