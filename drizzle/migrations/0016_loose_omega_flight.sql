ALTER TABLE "actions" RENAME TO "server_functions";--> statement-breakpoint
ALTER TABLE "server_functions" DROP CONSTRAINT "actions_name_unique";--> statement-breakpoint
ALTER TABLE "server_functions" DROP CONSTRAINT "actions_function_call_id_function_calls_id_fk";
--> statement-breakpoint
ALTER TABLE "function_calls" DROP CONSTRAINT "function_calls_action_id_actions_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "server_functions" ADD CONSTRAINT "server_functions_function_call_id_function_calls_id_fk" FOREIGN KEY ("function_call_id") REFERENCES "public"."function_calls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "function_calls" ADD CONSTRAINT "function_calls_action_id_server_functions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."server_functions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "server_functions" ADD CONSTRAINT "server_functions_name_unique" UNIQUE("name");