import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./auth";
import { healthRoutes } from "./routes/health";
import { productRoutes } from "./routes/products";
import { locationRoutes } from "./routes/locations";
import { inventoryRoutes } from "./routes/inventory";
import { purchaseOrderRoutes } from "./routes/purchase-orders";

const app = new Hono()
  .use("*", logger())
  .use(
    "*",
    cors({
      origin: [
        "http://localhost:3000",
        process.env.WEB_URL ?? "http://localhost:3000",
      ],
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
    }),
  )
  .on(["POST", "GET"], "/api/auth/**", (c) => {
    return auth.handler(c.req.raw);
  })
  .route("/api", healthRoutes)
  .route("/api", productRoutes)
  .route("/api", locationRoutes)
  .route("/api", inventoryRoutes)
  .route("/api", purchaseOrderRoutes);

export { app };
export type AppType = typeof app;
