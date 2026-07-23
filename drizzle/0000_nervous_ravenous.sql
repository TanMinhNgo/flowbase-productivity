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
CREATE TABLE "kanban_boards" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" text NOT NULL,
	"name" text NOT NULL,
	"color" text DEFAULT 'coral' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_columns" (
	"id" serial PRIMARY KEY NOT NULL,
	"board_id" integer NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanban_tasks" (
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
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" text NOT NULL,
	"name" text,
	"email" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "calendar_items_clerk_id_idx" ON "calendar_items" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "calendar_items_scheduled_date_idx" ON "calendar_items" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "kanban_boards_clerk_id_idx" ON "kanban_boards" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "kanban_tasks_board_id_idx" ON "kanban_tasks" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX "kanban_tasks_column_id_idx" ON "kanban_tasks" USING btree ("column_id");