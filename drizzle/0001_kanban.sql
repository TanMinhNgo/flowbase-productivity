CREATE TABLE IF NOT EXISTS "kanban_boards" (
  "id" serial PRIMARY KEY NOT NULL,
  "clerk_id" text NOT NULL,
  "name" text NOT NULL,
  "color" text DEFAULT 'coral' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kanban_columns" (
  "id" serial PRIMARY KEY NOT NULL,
  "board_id" integer NOT NULL,
  "name" text NOT NULL,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kanban_tasks" (
  "id" serial PRIMARY KEY NOT NULL,
  "board_id" integer NOT NULL,
  "column_id" integer NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "due_date" date,
  "priority" text DEFAULT 'medium' NOT NULL,
  "labels" text DEFAULT '[]' NOT NULL,
  "sync_calendar" boolean DEFAULT false NOT NULL,
  "linked_to_notes" boolean DEFAULT false NOT NULL,
  "calendar_item_id" integer,
  "position" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kanban_boards_clerk_id_idx" ON "kanban_boards" USING btree ("clerk_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kanban_tasks_board_id_idx" ON "kanban_tasks" USING btree ("board_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kanban_tasks_column_id_idx" ON "kanban_tasks" USING btree ("column_id");
