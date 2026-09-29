-- @vybrr/auth-framework Phase 3 reserved table.
-- docs/requirements/tenant-app-auth-design.md Section 5/7 — tenant-configured
-- OAuth2/OIDC providers, not a fixed enum. auth_schema.sql (Phase 1) already
-- created auth_credential.provider_id as a plain UUID with no FK, precisely
-- because this table didn't exist yet — the FK is completed here, once.
--
-- Copied and renumbered into the tenant's migrations/ directory by
-- scaffold_oauth_provider (packages/mcp-vybrr-scaffold), never applied
-- directly from this template location.

CREATE TABLE auth_oauth_provider (
    provider_id       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    label             TEXT          NOT NULL,
    protocol          TEXT          NOT NULL,
    authorize_url     TEXT          NOT NULL,
    token_url         TEXT          NOT NULL,
    userinfo_url      TEXT,
    issuer            TEXT,
    jwks_url          TEXT,
    client_id         TEXT          NOT NULL,
    client_secret_enc BYTEA         NOT NULL,
    scopes            TEXT[]        NOT NULL,
    enabled           BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

ALTER TABLE auth_credential
    ADD CONSTRAINT auth_credential_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES auth_oauth_provider (provider_id);

-- tenant-app-auth-design.md Section 9's own note on auth_user's DDL: a
-- table-wide UNIQUE(email) makes "OAuth login creates a separate identity
-- when there's no verified match" impossible (a raw constraint violation
-- instead). auth_schema.sql's template already ships the corrected
-- (verified-only) constraint for anything scaffolding fresh from Phase 3
-- onward — this repeats the fix for a tenant that ran scaffold_auth before
-- this phase existed, so adopting OAuth on an already-scaffolded tenant
-- gets the same guarantee. auth_user_email_key is the name Postgres
-- auto-assigns a table-level `UNIQUE` column modifier (<table>_<column>_key).
ALTER TABLE auth_user DROP CONSTRAINT IF EXISTS auth_user_email_key;
CREATE UNIQUE INDEX IF NOT EXISTS auth_user_email_verified_unique ON auth_user (email) WHERE email_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_auth_user_email ON auth_user (email);

-- Not in tenant-app-auth-design.md's original §5 DDL — added here because the
-- flow diagram in §7 implies state/PKCE survive the browser round-trip to
-- the provider and back, without saying how. A workerd isolate is not a
-- reliable place to hold that in memory (the callback request can land on a
-- different isolate instance than the one that issued the redirect), so it's
-- persisted here instead, keyed by an opaque session id set as a short-lived
-- httpOnly cookie (never the `state` query param itself, so a leaked
-- `state` value alone can't be replayed to forge the PKCE pairing) and
-- consumed exactly once.
CREATE TABLE auth_oauth_pending (
    session_id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id           UUID          NOT NULL REFERENCES auth_oauth_provider (provider_id),
    state                 TEXT          NOT NULL,
    code_verifier         TEXT          NOT NULL,
    expires_at            TIMESTAMPTZ   NOT NULL,
    -- Phase 5 (@vybrr/auth-framework-react) — nullable: only set when the
    -- frontend supplied and had allow-listed a real redirect_uri
    -- (routes/oauth.ts's isAllowedFrontendRedirect); NULL keeps the
    -- original JSON-response behavior for API-only callers. Added here
    -- (not a separate migration) since this table itself was only
    -- introduced in this same file — a tenant scaffolding OAuth for the
    -- first time from now on gets it unconditionally; a tenant who already
    -- has this table from before this column existed gets it via the
    -- ALTER TABLE below instead, same pattern this file's own
    -- auth_user_email_key fix already established.
    frontend_redirect_uri TEXT,
    created_at             TIMESTAMPTZ   NOT NULL DEFAULT now()
);
ALTER TABLE auth_oauth_pending ADD COLUMN IF NOT EXISTS frontend_redirect_uri TEXT;
