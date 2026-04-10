import { Hono } from "hono";

export const healthRoutes = new Hono().get("/health", (c) => {
  return c.json({
    data: {
      status: "ok",
      service: "kratos-api",
      timestamp: new Date().toISOString(),
    },
  });
});
