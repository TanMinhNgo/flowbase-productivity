CREATE TABLE IF NOT EXISTS "spaces" (
  "id" serial PRIMARY KEY NOT NULL,
  "clerk_id" text NOT NULL,
  "name" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "color" text DEFAULT 'violet' NOT NULL,
  "is_favorite" boolean DEFAULT false NOT NULL,
  "archived_at" timestamp,
  "last_opened_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "spaces_clerk_id_idx" ON "spaces" USING btree ("clerk_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "spaces_clerk_id_archived_at_idx" ON "spaces" USING btree ("clerk_id", "archived_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "space_collaborators" (
  "id" serial PRIMARY KEY NOT NULL,
  "space_id" integer NOT NULL,
  "clerk_id" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "space_collaborators_space_user_idx" ON "space_collaborators" USING btree ("space_id", "clerk_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "space_collaborators_clerk_id_idx" ON "space_collaborators" USING btree ("clerk_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "space_pages" (
  "id" serial PRIMARY KEY NOT NULL,
  "space_id" integer NOT NULL,
  "title" text DEFAULT 'Untitled page' NOT NULL,
  "template" text DEFAULT 'Blank Page' NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "content" text DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}' NOT NULL,
  "plain_text" text DEFAULT '' NOT NULL,
  "is_favorite" boolean DEFAULT false NOT NULL,
  "archived_at" timestamp,
  "created_by" text NOT NULL,
  "updated_by" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "space_pages_space_id_idx" ON "space_pages" USING btree ("space_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "space_pages_space_id_archived_at_idx" ON "space_pages" USING btree ("space_id", "archived_at");
