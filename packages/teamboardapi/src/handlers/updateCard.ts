// Update a card.
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

const updateBody = z.object({
  board_id: z.string().uuid().optional(),
  title: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
  assignee_id: z.string().uuid().nullable().optional(),
  due_date: z.string().date().nullable().optional(),
  column_name: z.string().trim().min(1).optional(),
});

export const updateCardRoute = createRoute({
  method: "patch",
  path: "/cards/{id}",
  tags: ["card"],
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { "application/json": { schema: updateBody } } },
  },
  responses: {
    200: { content: { "application/json": { schema: card } }, description: "The updated card" },
    403: { content: { "application/json": { schema: z.object({ error: z.string() }) } }, description: "Not yours, and your role can't change other people's" },
    404: { content: { "application/json": { schema: z.object({ error: z.string() }) } }, description: "Not found" },
  },
});

export function registerUpdateCardRoute(app: OpenAPIHono<AppEnv>): void {
  app.openapi(updateCardRoute, async (c) => {
    const userId = c.get("authUserId");
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const sql = db(c.env, { authUserId: userId, authRoles: c.get("authRoles") });
    const [existing] = await sql`
      SELECT c.id, c.board_id, c.title, c.description, c.assignee_id, c.due_date, c.column_name, c.created_at, c.owner_id
      FROM card c JOIN board b ON b.id = c.board_id
      JOIN team_member tm ON tm.team_id = b.team_id
      WHERE c.id = ${id} AND tm.user_id = ${userId}`;
    if (!existing) {
      return c.json({ error: "Not found" }, 404);
    }
    const [row] = await sql`
      UPDATE card SET
        board_id = ${body.board_id ?? (existing.board_id as string)},
        title = ${body.title ?? (existing.title as string)},
        description = ${body.description === undefined ? (existing.description as string | null) : body.description},
        assignee_id = ${body.assignee_id === undefined ? (existing.assignee_id as string | null) : body.assignee_id},
        due_date = ${body.due_date === undefined ? (existing.due_date as string | null) : body.due_date},
        column_name = ${body.column_name ?? (existing.column_name as string)}
      WHERE id = ${id}
      RETURNING id, board_id, title, description, assignee_id, due_date, column_name, created_at`;
    return c.json(card.parse(row), 200);
  });
}
