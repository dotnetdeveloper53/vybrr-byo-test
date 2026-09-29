// List cards.
import { createRoute, z, type OpenAPIHono } from "@hono/zod-openapi";
import { requireAuth } from "@vybrr/auth-framework";

import { db } from "../db.js";
import type { AppEnv } from "../env.js";

// postgres.js returns timestamp columns as Date; the response carries ISO strings.
const isoTimestamp = z.preprocess((value) => (value instanceof Date ? value.toISOString() : value), z.string());
const isoDate = z.preprocess((value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value), z.string());

const card = z.object({
  id: z.string().uuid(),
  board_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  assignee_id: z.string().uuid().nullable(),
  due_date: isoDate.nullable(),
  column_name: z.string(),
  created_at: isoTimestamp,
});

export const listCardRoute = createRoute({
  method: "get",
  path: "/cards",
  tags: ["card"],
  middleware: [requireAuth] as const,
  responses: {
    200: { content: { "application/json": { schema: z.array(card) } }, description: "The cards" },
  },
});

export function registerListCardRoute(app: OpenAPIHono<AppEnv>): void {
  app.openapi(listCardRoute, async (c) => {
    const userId = c.get("authUserId");
    const rows = await db(c.env, { authUserId: userId, authRoles: c.get("authRoles") })`
      SELECT c.id, c.board_id, c.title, c.description, c.assignee_id, c.due_date, c.column_name, c.created_at FROM card c
      JOIN team_member tm ON tm.team_id = (SELECT b.team_id FROM board b WHERE b.id = c.board_id)
      WHERE tm.user_id = ${userId}
      ORDER BY c.created_at DESC`;
    return c.json(rows.map((row) => card.parse(row)), 200);
  });
}
