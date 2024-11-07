ALTER TABLE "action_calls" RENAME COLUMN "saved_input" TO "args";--> statement-breakpoint
ALTER TABLE "action_calls" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;