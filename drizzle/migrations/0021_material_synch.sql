CREATE TYPE "public"."model" AS ENUM('Users', 'Sessions', 'Actions', 'Function Calls', 'Request Errors', 'Debug Logs', 'Objects', 'Requests');--> statement-breakpoint
ALTER TYPE "public"."action_type" RENAME TO "server_function_type";--> statement-breakpoint
ALTER TABLE "objects" ALTER COLUMN "model" SET DATA TYPE model;--> statement-breakpoint
ALTER TABLE "public"."server_functions" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."server_function_type";--> statement-breakpoint
CREATE TYPE "public"."server_function_type" AS ENUM('SYSTEM', 'USER');--> statement-breakpoint
ALTER TABLE "public"."server_functions" ALTER COLUMN "type" SET DATA TYPE "public"."server_function_type" USING "type"::"public"."server_function_type";