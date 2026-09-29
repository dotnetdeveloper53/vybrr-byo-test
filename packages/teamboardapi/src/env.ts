import type { AuthVariables } from "@vybrr/auth-framework";
// workerd (the real Cloudflare Workers runtime tenant code actually runs
// in) has no `process` global at all — confirmed for real running a live
// demo ("ReferenceError: process is not defined"). Environment bindings
// (DATABASE_URL etc., injected by dispatch.js at isolate load time) are
// passed per-request via the Workers fetch signature instead, which Hono
// exposes as `c.env` on every request context. Every Hono() instance that
// needs a binding must declare `new Hono<{ Bindings: Bindings }>()` so
// `c.env` is typed, and every handler must read `c.env` directly — nothing
// can read env vars at module load time, since bindings aren't available
// until a request actually arrives.
export interface Bindings {
  DATABASE_URL: string;
  // observability-design.md §3.2/§8.1 — set by dispatch.js at isolate
  // construction time (apps/workerd-supervisor/dispatch.js), never by a
  // request header. There is no ingress header injection anywhere in this
  // platform (tenant-runtime-architecture.md line 893) — this binding is
  // actually a stronger trust boundary than a header would be, since tenant
  // code cannot override it per-request.
  TENANT_ID: string;
  INSTANCE_SLUG: string;
  BUILD_ID: string;
  ENVIRONMENT: string;
  AUTH_JWT_PRIVATE_KEY: string;
  AUTH_JWT_PUBLIC_KEY: string;
  AUTH_ADMIN_TOKEN: string;
}

// The single Hono environment type for this instance: routes.ts's app and
// every handler's register function are both typed on it, so anything that
// widens it (scaffold_auth adding Variables for the authenticated user)
// reaches the whole instance at once rather than each file separately.
//
// No `Variables` member until something actually sets one — Hono types
// `c.get`'s key as the keys of Variables, so an instance with no context
// variables correctly has no usable `c.get` at all.
export type AppEnv = { Bindings: Bindings; Variables: AuthVariables };
