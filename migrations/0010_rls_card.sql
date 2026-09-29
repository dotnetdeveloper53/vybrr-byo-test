-- tenant-app-auth-design.md §12: lets the Vybrr console read rows that
-- row-level security hides from the app. Generated; don't edit.
CREATE OR REPLACE FUNCTION vybrr_platform_session() RETURNS boolean
  LANGUAGE sql STABLE
  AS $$ SELECT session_user::text !~ '^tenant_' $$;

-- tenant-app-auth-design.md §12: does the caller hold this permission?
-- Generated; don't edit.
CREATE OR REPLACE FUNCTION auth_has_permission(permission text) RETURNS boolean
  LANGUAGE sql STABLE
  AS $$
    SELECT EXISTS (
      SELECT 1
      FROM auth_role r
      JOIN auth_role_permission rp ON rp.role_id = r.role_id
      JOIN auth_permission p ON p.permission_id = rp.permission_id
      WHERE p.slug = permission
        AND r.slug = ANY (string_to_array(current_setting('vybrr.auth_roles', TRUE), ','))
    )
  $$;

ALTER TABLE card ENABLE ROW LEVEL SECURITY;
ALTER TABLE card FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS card_select ON card;
CREATE POLICY card_select ON card
  FOR SELECT
  USING (
    owner_id = NULLIF(current_setting('vybrr.auth_user_id', TRUE), '')::uuid
    OR auth_has_permission('ViewNonOwnedCard')
    OR vybrr_platform_session()
  );

DROP POLICY IF EXISTS card_insert ON card;
CREATE POLICY card_insert ON card
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS card_update ON card;
CREATE POLICY card_update ON card
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS card_delete ON card;
CREATE POLICY card_delete ON card
  FOR DELETE
  USING (true);
