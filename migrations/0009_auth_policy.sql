INSERT INTO auth_permission (slug) VALUES
    ('ViewNonOwnedCard'),
    ('ModifyNonOwnedCard'),
    ('DeleteNonOwnedCard')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO auth_role_permission (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM auth_role r, auth_permission p
WHERE (r.slug, p.slug) IN
(    ('team_member', 'ViewNonOwnedCard'),
    ('team_member', 'ModifyNonOwnedCard'),
    ('team_owner', 'ViewNonOwnedCard'),
    ('team_owner', 'ModifyNonOwnedCard'),
    ('team_owner', 'DeleteNonOwnedCard')
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

ALTER TABLE auth_role ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE auth_role SET is_default = (slug = 'team_member');
