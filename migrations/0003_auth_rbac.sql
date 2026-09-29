-- @vybrr/auth-framework Phase 2 reserved tables.
-- docs/requirements/tenant-app-auth-design.md Section 5/11 (RBAC + ownership).
-- Copied and renumbered into the tenant's migrations/ directory by
-- scaffold_auth (packages/mcp-vybrr-scaffold), never applied directly from
-- this template location. Ships alongside Phase 1's auth_schema.sql but as
-- its own migration file, matching that file's own stated principle:
-- RBAC/OAuth/2FA tables land as their own migrations when those features
-- exist, not stubbed early.

CREATE TABLE auth_role (
    role_id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    slug              TEXT          NOT NULL UNIQUE,
    label             TEXT          NOT NULL,
    -- Given to every new user at sign-up (tenant-app-auth-design.md §11,
    -- docs/plans/2026-09-29-default-role-at-signup.md). Set through the
    -- generated policy seed, never by hand.
    is_default        BOOLEAN       NOT NULL DEFAULT FALSE
);

CREATE TABLE auth_permission (
    permission_id     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    slug              TEXT          NOT NULL UNIQUE
);

CREATE TABLE auth_role_permission (
    role_id           UUID          NOT NULL REFERENCES auth_role (role_id),
    permission_id     UUID          NOT NULL REFERENCES auth_permission (permission_id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE auth_user_role (
    auth_user_id      UUID          NOT NULL REFERENCES auth_user (auth_user_id),
    role_id           UUID          NOT NULL REFERENCES auth_role (role_id),
    PRIMARY KEY (auth_user_id, role_id)
);
