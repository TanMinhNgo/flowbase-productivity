CREATE TABLE IF NOT EXISTS "ai_templates" (
  "id" serial PRIMARY KEY NOT NULL,
  "clerk_id" text NOT NULL,
  "prompt" text NOT NULL,
  "app_name" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "icon" text DEFAULT 'LayoutTemplate' NOT NULL,
  "color" text DEFAULT '#7c5ce0' NOT NULL,
  "layout" text DEFAULT 'single-page' NOT NULL,
  "app_json" text NOT NULL,
  "runtime_data" text DEFAULT '{}' NOT NULL,
  "is_in_sidebar" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_templates_clerk_id_idx" ON "ai_templates" USING btree ("clerk_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_templates_clerk_id_sidebar_idx" ON "ai_templates" USING btree ("clerk_id", "is_in_sidebar");
