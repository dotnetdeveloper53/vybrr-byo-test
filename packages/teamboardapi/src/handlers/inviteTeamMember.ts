// Invite a person by email; only the team owner may invite
import { createRoute, z, type OpenAPIHono } from "@hono/zod-openapi";
import { requireAuth } from "@vybrr/auth-framework";

import type { AppEnv } from "../env.js";

export const inviteTeamMemberRoute = createRoute({
  method: "post",
  path: "/teams/{teamId}/invitations",
  tags: ["inviteTeamMember"],
  // Only signed-in users reach the handler: requireAuth answers 401 otherwise.
  middleware: [requireAuth] as const,
  request: {
    params: z.object({ teamId: z.string() }),
    body: {
      content: { "application/json": { schema: z.object({}) } },
    },
  },
  responses: {
    501: {
      content: { "application/json": { schema: z.object({ error: z.string() }) } },
      description: "Not implemented yet",
    },
  },
});

export function registerInviteTeamMemberRoute(app: OpenAPIHono<AppEnv>): void {
  // To implement, replace the handler below. app.openapi takes exactly two arguments, the route
  // and the handler — middleware belongs in the route's middleware list, never between them.
  //   - c.get("authUserId") is the signed-in user's id.
  //   - c.req.valid("param") and c.req.valid("json") return the validated input; edit the request schemas above.
  //   - Query the database with the db helper (import { db } from "../db.js"):
  //       const rows = await db(c.env, { authUserId: c.get("authUserId"), authRoles: c.get("authRoles") })`SELECT ...`;
  //     Passing the user applies the database's row-level security to the query.
  //   - Declare every status you return in responses above, with its schema, then return it,
  //     e.g. c.json(rows, 200) — c.json won't type-check against an undeclared status.
  app.openapi(inviteTeamMemberRoute, (c) => c.json({ error: "not implemented" }, 501));
}
