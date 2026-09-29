import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";

import type { AppEnv } from "./env.js";
import { registerHealthRoute } from "./handlers/health.js";
import { createAdminRoutes, createAuthRoutes, createOauthRoutes } from "@vybrr/auth-framework";
import { registerListBoardRoute } from "./handlers/listBoard.js";
import { registerCreateBoardRoute } from "./handlers/createBoard.js";
import { registerUpdateBoardRoute } from "./handlers/updateBoard.js";
import { registerDeleteBoardRoute } from "./handlers/deleteBoard.js";
import { registerListCardRoute } from "./handlers/listCard.js";
import { registerCreateCardRoute } from "./handlers/createCard.js";
import { registerUpdateCardRoute } from "./handlers/updateCard.js";
import { registerDeleteCardRoute } from "./handlers/deleteCard.js";
import { registerCreateTeamRoute } from "./handlers/createTeam.js";
import { registerInviteTeamMemberRoute } from "./handlers/inviteTeamMember.js";
import { registerAcceptTeamInvitationRoute } from "./handlers/acceptTeamInvitation.js";
import { registerRemoveTeamMemberRoute } from "./handlers/removeTeamMember.js";

// Typed on AppEnv (env.ts) rather than an inline { Bindings: Bindings } so
// c.env is checked wherever a handler reads it, and so scaffold_auth can
// widen the environment for the app and every handler in one edit.
//
// OpenAPIHono (was plain Hono before this) — every route register_api_route
// scaffolds now declares a real createRoute() schema (mirroring
// apps/platform-api's own routes/*.ts convention exactly, CLAUDE.md §4),
// which is what makes the /openapi.json + /docs Swagger UI below reflect
// real, current routes rather than a hand-maintained page that drifts. This
// is also the real, tangible visual aid the Preview pane shows for
// api-application-server components, which have no browsable frontend of
// their own to preview otherwise.
export const app = new OpenAPIHono<AppEnv>();

// No request-logging middleware: observability-design.md §3.2/§9 — the
// platform's dispatch worker writes (and signs) every access log line, and
// a tenant-printed one is never attributed to any tenant.

// Frontend and backend components are served from different subdomains
// (tenant-hostnames.ts: *.ui.<tenant>.vybrr.app vs *.api.<tenant>.vybrr.app),
// never the same origin — every browser fetch from a tenant's own frontend
// to its own backend is genuinely cross-origin. Confirmed for real: without
// this, a real scaffolded frontend page's fetch() to a real scaffolded
// backend failed with no CORS headers at all.
app.use(
  "*",
  cors({
    origin: (origin) =>
      /^https:\/\/[a-z0-9-]+\.(dev|test|prod)\.ui\.ben\.vybrr\.app$/.test(origin) ? origin : undefined,
    credentials: true,
  }),
);

registerHealthRoute(app);

// Real spec, not a static page — reflects every route actually registered
// via app.openapi() above, the same app.doc()/swaggerUI() pair
// apps/platform-api's own app.ts already uses for its own API.
app.doc("/openapi.json", { openapi: "3.0.0", info: { title: "teamboardapi", version: "0.0.0" } });
app.get("/docs", swaggerUI({ url: "/openapi.json" }));
app.route(
  "/auth",
  createAuthRoutes(async () => {
    throw new Error(
      "Email transport not configured — wire a real EmailSender before using email-dependent auth flows",
    );
  }),
);
app.route(
  "/auth/admin",
  createAdminRoutes(async () => {
    throw new Error(
      "Email transport not configured — wire a real EmailSender before using email-dependent auth flows",
    );
  }),
);
app.route("/auth", createOauthRoutes());
registerListBoardRoute(app);
registerCreateBoardRoute(app);
registerUpdateBoardRoute(app);
registerDeleteBoardRoute(app);
registerListCardRoute(app);
registerCreateCardRoute(app);
registerUpdateCardRoute(app);
registerDeleteCardRoute(app);
registerCreateTeamRoute(app);
registerInviteTeamMemberRoute(app);
registerAcceptTeamInvitationRoute(app);
registerRemoveTeamMemberRoute(app);
