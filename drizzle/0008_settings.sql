CREATE TABLE IF NOT EXISTS "user_settings" (
  "id" serial PRIMARY KEY NOT NULL,
  "clerk_id" text NOT NULL UNIQUE,
  "theme" text DEFAULT 'system' NOT NULL,
  "notifications_enabled" boolean DEFAULT true NOT NULL,
  "calendar_view" text DEFAULT 'month' NOT NULL,
  "task_priority" text DEFAULT 'medium' NOT NULL,
  "auto_save" boolean DEFAULT true NOT NULL,
  "ai_model" text DEFAULT 'gpt-5.6-luna' NOT NULL,
  "ai_tone" text DEFAULT 'balanced' NOT NULL,
  "ai_behavior" text DEFAULT 'concise' NOT NULL,
  "ai_refine_enabled" boolean DEFAULT true NOT NULL,
  "ai_assistant_enabled" boolean DEFAULT true NOT NULL,
  "ai_templates_enabled" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_settings_clerk_id_idx" ON "user_settings" ("clerk_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "custom_categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "clerk_id" text NOT NULL,
  "scope" text NOT NULL,
  "name" text NOT NULL,
  "color" text DEFAULT '#7c5ce0' NOT NULL,
  "icon" text DEFAULT 'Tag' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "custom_categories_clerk_id_idx" ON "custom_categories" ("clerk_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "custom_categories_user_scope_name_idx" ON "custom_categories" ("clerk_id", "scope", "name");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monthly_usage" (
  "id" serial PRIMARY KEY NOT NULL,
  "clerk_id" text NOT NULL,
  "month_key" text NOT NULL,
  "ai_requests" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "monthly_usage_user_month_idx" ON "monthly_usage" ("clerk_id", "month_key");
--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN IF NOT EXISTS "category" text DEFAULT 'general' NOT NULL;
