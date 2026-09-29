// List boards.
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

export const listBoardRoute = createRoute({
  method: "get",
  path: "/boards",
  tags: ["board"],
  middleware: [requireAuth] as const,
  responses: {
    200: { content: { "application/json": { schema: z.array(board) } }, description: "The boards" },
  },
});

export function registerListBoardRoute(app: OpenAPIHono<AppEnv>): void {
  app.openapi(listBoardRoute, async (c) => {
    const userId = c.get("authUserId");
    const rows = await db(c.env, { authUserId: userId, authRoles: c.get("authRoles") })`
      SELECT DISTINCT b.id, b.team_id, b.name, b.created_at FROM board b
      JOIN team_member tm ON tm.team_id = b.team_id
      WHERE tm.user_id = ${userId}
      ORDER BY b.created_at DESC`;
    return c.json(rows.map((row) => board.parse(row)), 200);
  });
}
