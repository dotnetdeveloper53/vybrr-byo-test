import { createRoute, z, type OpenAPIHono } from "@hono/zod-openapi";

import type { AppEnv } from "../env.js";

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["health"],
  responses: {
    200: {
      content: { "application/json": { schema: z.object({ status: z.literal("ok") }) } },
      description: "The instance is up and serving requests",
    },
  },
});

export function registerHealthRoute(app: OpenAPIHono<AppEnv>): void {
  app.openapi(healthRoute, (c) => c.json({ status: "ok" as const }, 200));
}
