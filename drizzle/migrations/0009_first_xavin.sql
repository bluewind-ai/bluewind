ALTER TABLE "objects" ALTER COLUMN "function_call_id" SET NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "objects" ADD CONSTRAINT "objects_function_call_id_function_calls_id_fk" FOREIGN KEY ("function_call_id") REFERENCES "public"."function_calls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
