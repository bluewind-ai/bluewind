ALTER TABLE "objects" DROP CONSTRAINT "objects_function_call_id_function_calls_id_fk";
--> statement-breakpoint
ALTER TABLE "objects" DROP COLUMN IF EXISTS "function_call_id";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN IF EXISTS "function_call_id";--> statement-breakpoint
ALTER TABLE "server_functions" DROP COLUMN IF EXISTS "function_call_id";