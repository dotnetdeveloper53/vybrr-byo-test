// Delete a card.
import { createRoute, z, type OpenAPIHono } from "@hono/zod-openapi";
import { requireAuth } from "@vybrr/auth-framework";

import { db } from "../db.js";
import type { AppEnv } from "../env.js";

export const deleteCardRoute = createRoute({
  method: "delete",
  path: "/cards/{id}",
  tags: ["card"],
  middleware: [requireAuth] as const,
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: { content: { "application/json": { schema: z.object({ id: z.string().uuid() }) } }, description: "The deleted card's id" },
    403: { content: { "application/json": { schema: z.object({ error: z.string() }) } }, description: "Not yours, and your role can't change other people's" },
    404: { content: { "application/json": { schema: z.object({ error: z.string() }) } }, description: "Not found" },
  },
});

export function registerDeleteCardRoute(app: OpenAPIHono<AppEnv>): void {
  app.openapi(deleteCardRoute, async (c) => {
    const userId = c.get("authUserId");
    const { id } = c.req.valid("param");
    const sql = db(c.env, { authUserId: userId, authRoles: c.get("authRoles") });
    const [existing] = await sql`
      SELECT id, owner_id FROM card
      WHERE id = ${id}
      AND (owner_id = ${userId} OR auth_has_permission('ViewNonOwnedCard'))`;
    if (!existing) {
      return c.json({ error: "Not found" }, 404);
    }
    if (String(existing.owner_id) !== userId) {
      const [permitted] = await sql`SELECT auth_has_permission('DeleteNonOwnedCard') AS ok`;
      if (permitted?.ok !== true) {
        return c.json({ error: "You can only delete your own." }, 403);
      }
    }
    await sql`DELETE FROM card WHERE id = ${id}`;
    return c.json({ id }, 200);
  });
}
