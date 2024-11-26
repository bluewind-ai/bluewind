ALTER TABLE "function_calls" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "function_calls" CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_function_call_id_function_calls_id_fk";
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_function_call_id_function_calls_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" DROP COLUMN IF EXISTS "function_call_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "function_call_id";--> statement-breakpoint
DROP TYPE "public"."function_call_status";