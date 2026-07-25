CREATE TABLE IF NOT EXISTS "assistant_conversations" ("id" serial PRIMARY KEY NOT NULL, "clerk_id" text NOT NULL, "title" text DEFAULT 'New conversation' NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL, "updated_at" timestamp DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assistant_conversations_user_idx" ON "assistant_conversations" ("clerk_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assistant_messages" ("id" serial PRIMARY KEY NOT NULL, "conversation_id" integer NOT NULL, "role" text NOT NULL, "content" text NOT NULL, "action_json" text, "created_at" timestamp DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assistant_messages_conversation_idx" ON "assistant_messages" ("conversation_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assistant_actions" ("id" serial PRIMARY KEY NOT NULL, "clerk_id" text NOT NULL, "conversation_id" integer NOT NULL, "type" text NOT NULL, "payload" text NOT NULL, "status" text DEFAULT 'pending' NOT NULL, "result" text, "created_at" timestamp DEFAULT now() NOT NULL, "updated_at" timestamp DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "assistant_actions_user_idx" ON "assistant_actions" ("clerk_id");
