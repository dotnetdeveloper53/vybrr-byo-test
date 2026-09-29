CREATE TABLE card (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL DEFAULT current_setting('vybrr.auth_user_id')::uuid REFERENCES auth_user (auth_user_id),
    board_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    assignee_id uuid,
    due_date date,
    column_name text NOT NULL DEFAULT 'To Do',
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);
