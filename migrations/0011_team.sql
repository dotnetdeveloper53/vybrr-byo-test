CREATE TABLE team (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL DEFAULT '',
    owner_id uuid NOT NULL DEFAULT null,
    PRIMARY KEY (id)
);
