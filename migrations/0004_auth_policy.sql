INSERT INTO auth_role (slug, label) VALUES
    ('team_owner', 'Team owner'),
    ('team_member', 'Team member')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO auth_permission (slug) VALUES
    ('ManageTeamMembership'),
    ('ViewTeamBoards'),
    ('EditTeamBoards')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO auth_role_permission (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM auth_role r, auth_permission p
WHERE (r.slug, p.slug) IN
(    ('team_owner', 'ManageTeamMembership'),
    ('team_owner', 'ViewTeamBoards'),
    ('team_owner', 'EditTeamBoards'),
    ('team_member', 'ViewTeamBoards'),
    ('team_member', 'EditTeamBoards')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

ALTER TABLE auth_role ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE auth_role SET is_default = FALSE;
