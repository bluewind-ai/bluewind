ALTER TABLE "actions" ADD COLUMN "function_call_id" integer;--> statement-breakpoint
ALTER TABLE "apps" ADD COLUMN "function_call_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "debug_logs" ADD COLUMN "function_call_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "objects" ADD COLUMN "function_call_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "request_errors" ADD COLUMN "function_call_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "function_call_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "function_call_id" integer NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "actions" ADD CONSTRAINT "actions_function_call_id_function_calls_id_fk" FOREIGN KEY ("function_call_id") REFERENCES "public"."function_calls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "apps" ADD CONSTRAINT "apps_function_call_id_function_calls_id_fk" FOREIGN KEY ("function_call_id") REFERENCES "public"."function_calls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "debug_logs" ADD CONSTRAINT "debug_logs_function_call_id_function_calls_id_fk" FOREIGN KEY ("function_call_id") REFERENCES "public"."function_calls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "objects" ADD CONSTRAINT "objects_function_call_id_function_calls_id_fk" FOREIGN KEY ("function_call_id") REFERENCES "public"."function_calls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "request_errors" ADD CONSTRAINT "request_errors_function_call_id_function_calls_id_fk" FOREIGN KEY ("function_call_id") REFERENCES "public"."function_calls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_function_call_id_function_calls_id_fk" FOREIGN KEY ("function_call_id") REFERENCES "public"."function_calls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_function_call_id_function_calls_id_fk" FOREIGN KEY ("function_call_id") REFERENCES "public"."function_calls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
