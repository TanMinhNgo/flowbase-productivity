CREATE TABLE IF NOT EXISTS "whiteboards" (
  "id" serial PRIMARY KEY NOT NULL,
  "clerk_id" text NOT NULL,
  "name" text DEFAULT 'Untitled whiteboard' NOT NULL,
  "color" text DEFAULT 'coral' NOT NULL,
  "elements" text DEFAULT '[]' NOT NULL,
  "app_state" text DEFAULT '{}' NOT NULL,
  "files" text DEFAULT '{}' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "whiteboards_clerk_id_idx" ON "whiteboards" USING btree ("clerk_id");
