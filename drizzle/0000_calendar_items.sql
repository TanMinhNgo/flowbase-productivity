CREATE TABLE "calendar_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "clerk_id" text NOT NULL,
  "title" text NOT NULL,
  "notes" text,
  "kind" text NOT NULL,
  "category" text NOT NULL,
  "scheduled_date" date,
  "scheduled_time" time,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "calendar_items_clerk_id_idx" ON "calendar_items" USING btree ("clerk_id");
--> statement-breakpoint
CREATE INDEX "calendar_items_scheduled_date_idx" ON "calendar_items" USING btree ("scheduled_date");
