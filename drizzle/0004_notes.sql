CREATE TABLE IF NOT EXISTS "notes" (
  "id" serial PRIMARY KEY NOT NULL,
  "clerk_id" text NOT NULL,
  "title" text DEFAULT 'Untitled note' NOT NULL,
  "content" text DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}' NOT NULL,
  "plain_text" text DEFAULT '' NOT NULL,
  "color" text DEFAULT 'coral' NOT NULL,
  "is_pinned" boolean DEFAULT false NOT NULL,
  "deleted_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notes_clerk_id_idx" ON "notes" USING btree ("clerk_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notes_clerk_id_deleted_at_idx" ON "notes" USING btree ("clerk_id", "deleted_at");
