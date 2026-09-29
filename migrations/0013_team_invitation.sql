CREATE TABLE team_invitation (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    team_id uuid NOT NULL DEFAULT null,
    email text NOT NULL DEFAULT '',
    token text NOT NULL UNIQUE DEFAULT '',
    expires_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);
