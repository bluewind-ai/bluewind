ALTER TABLE "function_calls" DROP CONSTRAINT "function_calls_parent_id_function_calls_id_fk";
--> statement-breakpoint
ALTER TABLE "function_calls" DROP COLUMN IF EXISTS "parent_id";