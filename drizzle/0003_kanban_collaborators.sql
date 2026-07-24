CREATE TABLE IF NOT EXISTS "kanban_board_collaborators" (
  "id" serial PRIMARY KEY NOT NULL,
  "board_id" integer NOT NULL,
  "clerk_id" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "kanban_board_collaborators_board_user_idx" ON "kanban_board_collaborators" USING btree ("board_id", "clerk_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kanban_board_collaborators_clerk_id_idx" ON "kanban_board_collaborators" USING btree ("clerk_id");
