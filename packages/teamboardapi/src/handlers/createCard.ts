// Create a card.
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

const createBody = z.object({
  board_id: z.string().uuid(),
  title: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  due_date: z.string().date().nullable().optional(),
  column_name: z.string().trim().min(1),
});

export const createCardRoute = createRoute({
  method: "post",
  path: "/cards",
  tags: ["card"],
  middleware: [requireAuth] as const,
  request: { body: { content: { "application/json": { schema: createBody } } } },
  responses: {
    201: { content: { "application/json": { schema: card } }, description: "The created card" },
  },
});

export function registerCreateCardRoute(app: OpenAPIHono<AppEnv>): void {
  app.openapi(createCardRoute, async (c) => {
    const userId = c.get("authUserId");
    const body = c.req.valid("json");
    const [row] = await db(c.env, { authUserId: userId, authRoles: c.get("authRoles") })`
      INSERT INTO card (owner_id, board_id, title, description, assignee_id, due_date, column_name)
      SELECT ${userId}, ${body.board_id}, ${body.title}, ${body.description ?? null}, ${body.assignee_id ?? null}, ${body.due_date ?? null}, ${body.column_name}
      WHERE EXISTS (SELECT 1 FROM board b JOIN team_member tm ON tm.team_id = b.team_id WHERE b.id = ${body.board_id} AND tm.user_id = ${userId})
      RETURNING id, board_id, title, description, assignee_id, due_date, column_name, created_at`;
    return c.json(card.parse(row), 201);
  });
}
