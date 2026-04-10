import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { healthRoutes } from "./routes/health";

export const app = new Hono()
  .use("*", logger())
  .use(
    "*",
    cors({
      origin: [
        "http://localhost:3000",
        process.env.WEB_URL ?? "http://localhost:3000",
      ],
      credentials: true,
    }),
  )
  .route("/api", healthRoutes);

export type AppType = typeof app;
