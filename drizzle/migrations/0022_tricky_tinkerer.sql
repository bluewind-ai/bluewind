ALTER TABLE "objects" DROP CONSTRAINT "objects_function_call_id_function_calls_id_fk";
--> statement-breakpoint
ALTER TABLE "objects" ALTER COLUMN "id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "public"."objects" ALTER COLUMN "model" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."model";--> statement-breakpoint
CREATE TYPE "public"."model" AS ENUM('users', 'sessions', 'actions', 'function-calls', 'request-errors', 'debug-logs', 'objects', 'requests');--> statement-breakpoint
ALTER TABLE "public"."objects" ALTER COLUMN "model" SET DATA TYPE "public"."model" USING "model"::"public"."model";