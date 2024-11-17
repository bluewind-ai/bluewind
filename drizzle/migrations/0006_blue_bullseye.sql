ALTER TABLE "apps" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "debug_logs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "request_errors" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "apps" CASCADE;--> statement-breakpoint
DROP TABLE "debug_logs" CASCADE;--> statement-breakpoint
DROP TABLE "request_errors" CASCADE;--> statement-breakpoint
ALTER TABLE "objects" ADD COLUMN "request_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "request_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "request_id" integer NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "objects" ADD CONSTRAINT "objects_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "models" DROP COLUMN IF EXISTS "request_id";