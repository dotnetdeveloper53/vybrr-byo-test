CREATE TABLE board (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL DEFAULT current_setting('vybrr.auth_user_id')::uuid REFERENCES auth_user (auth_user_id),
    team_id uuid NOT NULL,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);
