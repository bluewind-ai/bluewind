ALTER TABLE "server_functions" DROP CONSTRAINT "server_functions_name_unique";--> statement-breakpoint
ALTER TABLE "server_functions" DROP CONSTRAINT "server_functions_function_call_id_function_calls_id_fk";
--> statement-breakpoint
ALTER TABLE "server_functions" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "server_functions" ALTER COLUMN "function_call_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "public"."server_functions" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."server_function_type";--> statement-breakpoint
CREATE TYPE "public"."server_function_type" AS ENUM('SYSTEM', 'API');--> statement-breakpoint
ALTER TABLE "public"."server_functions" ALTER COLUMN "type" SET DATA TYPE "public"."server_function_type" USING "type"::"public"."server_function_type";