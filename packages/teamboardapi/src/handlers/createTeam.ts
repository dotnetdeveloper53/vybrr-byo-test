// Create a team for the signed-in user
import { createRoute, z, type OpenAPIHono } from "@hono/zod-openapi";
import { requireAuth } from "@vybrr/auth-framework";

import { db } from "../db.js";
import type { AppEnv } from "../env.js";

export const createTeamRoute = createRoute({
  method: "post",
  path: "/teams",
  tags: ["createTeam"],
  // Only signed-in users reach the handler: requireAuth answers 401 otherwise.
  middleware: [requireAuth] as const,
  request: {
    body: {
      content: { "application/json": { schema: z.object({}) } },
    },
  },
  responses: {
    201: { content: { "application/json": { schema: z.object({ id: z.string(), name: z.string() }) } }, description: "Created team" },
  },
});

export function registerCreateTeamRoute(app: OpenAPIHono<AppEnv>): void {
  app.openapi(createTeamRoute, async (c) => {
    const userId = c.get("authUserId");
    const [row] = await db(c.env, { authUserId: userId, authRoles: c.get("authRoles") })`
      INSERT INTO team (name, owner_id) VALUES (${"My Team"}, ${userId}) RETURNING id, name`;
    if (!row) return c.json({ id: "", name: "" }, 201);
    return c.json({ id: String(row.id), name: String(row.name) }, 201);
  });
}
