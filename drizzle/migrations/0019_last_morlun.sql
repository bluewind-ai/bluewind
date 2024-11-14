ALTER TABLE "function_calls" ADD COLUMN "request_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "server_functions" ADD COLUMN "request_id" integer NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "function_calls" ADD CONSTRAINT "function_calls_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "server_functions" ADD CONSTRAINT "server_functions_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
