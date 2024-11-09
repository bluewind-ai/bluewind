ALTER TABLE "action_calls" RENAME TO "function_calls";--> statement-breakpoint
ALTER TABLE "function_calls" DROP CONSTRAINT "action_calls_action_id_actions_id_fk";
--> statement-breakpoint
ALTER TABLE "function_calls" DROP CONSTRAINT "action_calls_parent_id_action_calls_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "function_calls" ADD CONSTRAINT "function_calls_action_id_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."actions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "function_calls" ADD CONSTRAINT "function_calls_parent_id_function_calls_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."function_calls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
