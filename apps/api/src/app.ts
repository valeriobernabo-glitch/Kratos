import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { auth } from "./auth";
import { healthRoutes } from "./routes/health";

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
  .route("/api", healthRoutes);

export { app };
export type AppType = typeof app;
