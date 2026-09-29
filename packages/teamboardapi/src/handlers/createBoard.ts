// Create a board.
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

const createBody = z.object({
  team_id: z.string().uuid(),
  name: z.string().trim().min(1),
});

export const createBoardRoute = createRoute({
  method: "post",
  path: "/boards",
  tags: ["board"],
  middleware: [requireAuth] as const,
  request: { body: { content: { "application/json": { schema: createBody } } } },
  responses: {
    201: { content: { "application/json": { schema: board } }, description: "The created board" },
  },
});

export function registerCreateBoardRoute(app: OpenAPIHono<AppEnv>): void {
  app.openapi(createBoardRoute, async (c) => {
    const userId = c.get("authUserId");
    const body = c.req.valid("json");
    const [row] = await db(c.env, { authUserId: userId, authRoles: c.get("authRoles") })`
      INSERT INTO board (owner_id, team_id, name)
      SELECT ${userId}, ${body.team_id}, ${body.name}
      WHERE EXISTS (SELECT 1 FROM team_member WHERE team_id = ${body.team_id} AND user_id = ${userId})
      RETURNING id, team_id, name, created_at`;
    return c.json(board.parse(row), 201);
  });
}
