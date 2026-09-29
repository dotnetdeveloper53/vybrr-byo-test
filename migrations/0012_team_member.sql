CREATE TABLE team_member (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    team_id uuid NOT NULL DEFAULT null,
    user_id uuid NOT NULL DEFAULT null,
    email text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'invited',
    PRIMARY KEY (id)
);
