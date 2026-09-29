-- @vybrr/auth-framework Phase 1 reserved tables.
-- docs/requirements/tenant-app-auth-design.md Section 5 (auth_role,
-- auth_permission, auth_role_permission, auth_user_role, auth_oauth_provider,
-- auth_recovery_code land in later phases as their own migration files, not
-- here — an unused reserved table in a Phase 1 tenant schema before those
-- features exist would be confusing scaffold-tool output for no benefit).
--
-- Copied and renumbered into the tenant's migrations/ directory by
-- scaffold_auth (packages/mcp-vybrr-scaffold), never applied directly from
-- this template location.

-- email is NOT globally UNIQUE — see auth_user_email_verified_unique below.
-- tenant-app-auth-design.md Section 9's auto-link algorithm requires that a
-- login whose email doesn't match a *verified* existing account creates a
-- genuinely separate identity, "exactly as if the email had never matched"
-- — impossible under a table-wide UNIQUE(email), which would instead throw
-- a raw constraint-violation error. Duplicate *unverified* emails are still
-- prevented at the app layer for password signup (routes/auth.ts's own
-- pre-insert SELECT), so this only relaxes what the DB itself blocks, not
-- what a real user-facing signup allows.
CREATE TABLE auth_user (
    auth_user_id     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    email             TEXT          NOT NULL,
    email_verified    BOOLEAN       NOT NULL DEFAULT FALSE,
    totp_enabled      BOOLEAN       NOT NULL DEFAULT FALSE,
    totp_secret_enc   BYTEA,
    failed_login_count SMALLINT     NOT NULL DEFAULT 0,
    locked_until      TIMESTAMPTZ,
    -- tenant-app-auth-design.md §17.3 — admin-disabled, NULL = active. Never
    -- a hard delete: owned resources hold a live owner_id FK into this
    -- table (§11), so deleting the row would orphan/FK-violate every
    -- app-defined table instead. A tenant scaffolding auth fresh from here
    -- on gets this unconditionally; a tenant who already has this table
    -- from before this column existed gets it via the ALTER TABLE below
    -- instead, same pattern auth_oauth.sql's own frontend_redirect_uri fix
    -- already established.
    disabled_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ;
-- Two verified accounts can never share an email — this is the actual trust
-- anchor auto-link (Section 9) relies on. Two *unverified* accounts may.
CREATE UNIQUE INDEX auth_user_email_verified_unique ON auth_user (email) WHERE email_verified = TRUE;
-- Plain UNIQUE(email) used to double as this lookup index; a bare (non-
-- unique) index keeps login/signup email lookups indexed regardless of
-- verification state now that uniqueness itself is verified-only above.
CREATE INDEX idx_auth_user_email ON auth_user (email);

CREATE TABLE auth_credential (
    credential_id     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id      UUID          NOT NULL REFERENCES auth_user (auth_user_id),
    method            TEXT          NOT NULL,
    provider_id       UUID,
    provider_subject  TEXT,
    password_hash     TEXT,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    UNIQUE (provider_id, provider_subject)
);

CREATE TABLE auth_refresh_token (
    token_id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id      UUID          NOT NULL REFERENCES auth_user (auth_user_id),
    token_hash        TEXT          NOT NULL UNIQUE,
    rotated_from      UUID          REFERENCES auth_refresh_token (token_id),
    expires_at        TIMESTAMPTZ   NOT NULL,
    revoked_at        TIMESTAMPTZ,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_auth_refresh_token_user ON auth_refresh_token (auth_user_id) WHERE revoked_at IS NULL;

CREATE TABLE auth_email_token (
    token_id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id      UUID          NOT NULL REFERENCES auth_user (auth_user_id),
    purpose           TEXT          NOT NULL,
    token_hash        TEXT          NOT NULL UNIQUE,
    expires_at        TIMESTAMPTZ   NOT NULL,
    used_at           TIMESTAMPTZ,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_auth_email_token_user ON auth_email_token (auth_user_id, purpose);

CREATE TABLE auth_audit_log (
    log_id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id      UUID          REFERENCES auth_user (auth_user_id),
    event_type        TEXT          NOT NULL,
    ip                INET,
    user_agent        TEXT,
    metadata          JSONB         NOT NULL DEFAULT '{}',
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_auth_audit_log_user_time ON auth_audit_log (auth_user_id, created_at DESC);
