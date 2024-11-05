CREATE TABLE IF NOT EXISTS "action_calls" (
	"id" serial PRIMARY KEY NOT NULL,
	"action_id" integer NOT NULL,
	"parent_id" integer,
	"status" varchar(256) DEFAULT 'ready_for_approval' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	CONSTRAINT "actions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "request_errors" (
	"id" serial PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"method" varchar(10) NOT NULL,
	"url" text NOT NULL,
	"headers" jsonb,
	"body" text,
	"stack" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "action_calls" ADD CONSTRAINT "action_calls_action_id_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."actions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "action_calls" ADD CONSTRAINT "action_calls_parent_id_action_calls_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."action_calls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
