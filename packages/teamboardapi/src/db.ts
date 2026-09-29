import { randomUUID } from "node:crypto";

import postgres from "postgres";

import type { Bindings } from "./env.js";

export type TaggedQuery = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<postgres.Row[]>;

// SET LOCAL doesn't accept bind parameters for its value position (postgres.js
// tagged templates can't help here), so these GUCs are raw-interpolated —
// authUserId/authRoles ultimately originate from a JWT-signature-verified
// request context (requireAuth/requirePermission), not raw user input, but
// validating their shape before they ever reach a raw SQL string is cheap
// and keeps that true even if a future caller populates authContext some
// other way.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLE_SLUG_PATTERN = /^[a-z0-9_]+$/;

function assertSafeAuthContext(authContext: { authUserId?: string; authRoles?: string[] }): void {
  if (authContext.authUserId !== undefined && !UUID_PATTERN.test(authContext.authUserId)) {
    throw new Error(`Refusing to set vybrr.auth_user_id to a non-UUID value: ${authContext.authUserId}`);
  }
  for (const role of authContext.authRoles ?? []) {
    if (!ROLE_SLUG_PATTERN.test(role)) {
      throw new Error(`Refusing to set vybrr.auth_roles with an invalid role slug: ${role}`);
    }
  }
}

// A passthrough-auth connection through PgDog using this tenant's own role
// (database-architecture.md). Postgres validates the credentials directly
// against the real role, and that role's own same-named schema is on the
// default search_path automatically ("$user", public), so table names here
// need no explicit schema-qualification.
//
// A fresh client per call, NOT a cached module-level singleton: workerd
// forbids reusing an I/O object (a socket, here) created during one
// request's handler from a different request's handler ("Cannot perform
// I/O on behalf of a different request") — confirmed for real, a cached
// client worked for the request that first opened it and then broke every
// subsequent request in the isolate.
//
// Every call is wrapped in its own transaction with a SET LOCAL vybrr.source
// issued first — database-architecture.md Section 8.3.1's audit trigger on
// any table the LLM has designated as reference data reads
// current_setting('vybrr.source', TRUE) to attribute the write. This is
// fully transparent to handler code: the call site below is unchanged from
// a bare `db(c.env)` tagged-template call, since this function returns a
// same-shaped callable that forwards the exact `strings`/`values` arguments
// it received into the transaction's own tagged-template call.
//
// Call this with the current request's env bindings (Hono's `c.env`, typed
// via Bindings — see env.ts) and use the result as a tagged-template query,
// not a .query() method:
//
//   getContacts.get("/", async (c) => {
//     const rows = await db(c.env)`SELECT id, name FROM contacts ORDER BY created_at DESC`;
//     return c.json(rows);
//   });
//
//   createContact.post("/", async (c) => {
//     const { name, email } = await c.req.json();
//     const [row] = await db(c.env)`INSERT INTO contacts (name, email) VALUES (${name}, ${email}) RETURNING id, name, email`;
//     return c.json(row, 201);
//   });
//
// Values interpolated with ${...} inside the template are always sent as
// real parameterised query arguments, never string-concatenated — safe
// against SQL injection by construction.
//
// tenant-app-auth-design.md Section 12 — a handler protected by
// requirePermission (from @vybrr/auth-framework) and reading/writing a
// table row-level security is enabled on must pass the caller's identity
// through so RLS policies (which compare against these same session GUCs)
// actually apply, instead of comparing against NULL and denying everything:
//
//   dealingRequests.patch("/:id", requirePermission("ModifyOwnedDealingRequest", {
//     ownership: { table: "dealing_request", param: "id" },
//   }), async (c) => {
//     const rows = await db(c.env, { authUserId: c.get("authUserId"), authRoles: c.get("authRoles") })`
//       SELECT * FROM dealing_request WHERE id = ${c.req.param("id")}
//     `;
//     ...
//   });
//
// Optional and additive — every existing db(c.env) call (no second
// argument) is unaffected, since it's the app-layer requirePermission check
// that's authoritative regardless; RLS is only the backstop Section 12
// describes, not a substitute for it.
export function db(
  env: Bindings,
  authContext?: { authUserId?: string; authRoles?: string[] },
): TaggedQuery {
  // Freshly generated per call, not user input — safe to interpolate
  // directly into SET LOCAL (which doesn't accept bind parameters for its
  // value position anyway).
  const source = `app:req-${randomUUID()}`;
  if (authContext) {
    assertSafeAuthContext(authContext);
  }
  // A client per query, not per db() call: each query ends its own client,
  // so one opened here would serve only the first query and fail the next
  // with CONNECTION_ENDED — which every generated update handler hit, since
  // it reads the row and then writes it through the same `sql`
  // (docs/plans/2026-09-24-scaffold-app-fixes.md).
  return async (strings, ...values) => {
    const client = postgres(env.DATABASE_URL);
    try {
      return await client.begin(async (tx) => {
        await tx.unsafe(`SET LOCAL vybrr.source = '${source}'`);
        if (authContext?.authUserId) {
          await tx.unsafe(`SET LOCAL vybrr.auth_user_id = '${authContext.authUserId}'`);
        }
        if (authContext?.authRoles) {
          await tx.unsafe(`SET LOCAL vybrr.auth_roles = '${authContext.authRoles.join(",")}'`);
        }
        // postgres.js's own tagged-template overload types its rest
        // parameter as ParameterOrFragment<never>[], which `unknown[]`
        // can't satisfy — this forwards values verbatim from a real tagged
        // template call the caller already made, so it satisfies
        // postgres.js's runtime expectations regardless of this static type.
        return tx(strings, ...(values as never[]));
      });
    } finally {
      await client.end();
    }
  };
}
