// Update a board.
import { createRoute, z, type OpenAPIHono } from "@hono/zod-openapi";
import { requireAuth } from "@vybrr/auth-framework";

import { db } from "../db.js";
import type { AppEnv } from "../env.js";

// postgres.js returns timestamp columns as Date; the response carries ISO strings.
const isoTimestamp = z.preprocess((value) => (value instanceof Date ? value.toISOString() : value), z.string());

const board = z.object({
  id: z.string().uuid(),
  team_id: z.string().uuid(),
  name: z.string(),
  created_at: isoTimestamp,
});

const updateBody = z.object({
  team_id: z.string().uuid().optional(),
  name: z.string().trim().min(1).optional(),
});

export const updateBoardRoute = createRoute({
  method: "patch",
  path: "/boards/{id}",
  tags: ["board"],
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { "application/json": { schema: updateBody } } },
  },
  responses: {
    200: { content: { "application/json": { schema: board } }, description: "The updated board" },
    403: { content: { "application/json": { schema: z.object({ error: z.string() }) } }, description: "Not yours, and your role can't change other people's" },
    404: { content: { "application/json": { schema: z.object({ error: z.string() }) } }, description: "Not found" },
  },
});

export function registerUpdateBoardRoute(app: OpenAPIHono<AppEnv>): void {
  app.openapi(updateBoardRoute, async (c) => {
    const userId = c.get("authUserId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const sql = db(c.env, { authUserId: userId, authRoles: c.get("authRoles") });
    const [existing] = await sql`
      SELECT id, team_id, name, created_at, owner_id FROM board
      WHERE id = ${id}
      AND (owner_id = ${userId} OR auth_has_permission('ViewNonOwnedBoard'))`;
    if (!existing) {
      return c.json({ error: "Not found" }, 404);
    }
    if (String(existing.owner_id) !== userId) {
      const [permitted] = await sql`SELECT auth_has_permission('ModifyNonOwnedBoard') AS ok`;
      if (permitted?.ok !== true) {
        return c.json({ error: "You can only change your own." }, 403);
      }
    }
    const [row] = await sql`
      UPDATE board SET
        team_id = ${body.team_id ?? (existing.team_id as string)},
        name = ${body.name ?? (existing.name as string)}
      WHERE id = ${id}
      RETURNING id, team_id, name, created_at`;
    return c.json(board.parse(row), 200);
  });
}
