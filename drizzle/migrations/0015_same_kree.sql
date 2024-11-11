ALTER TABLE "function_calls" ALTER COLUMN "status" SET DEFAULT 'READY_FOR_APPROVAL';--> statement-breakpoint
ALTER TABLE "public"."actions" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."action_type";--> statement-breakpoint
CREATE TYPE "public"."action_type" AS ENUM('USER', 'SYSTEM');--> statement-breakpoint
ALTER TABLE "public"."actions" ALTER COLUMN "type" SET DATA TYPE "public"."action_type" USING "type"::"public"."action_type";--> statement-breakpoint
ALTER TABLE "public"."function_calls" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."function_call_status";--> statement-breakpoint
CREATE TYPE "public"."function_call_status" AS ENUM('READY_FOR_APPROVAL', 'APPROVED', 'REJECTED', 'RUNNING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');--> statement-breakpoint
ALTER TABLE "public"."function_calls" ALTER COLUMN "status" SET DATA TYPE "public"."function_call_status" USING "status"::"public"."function_call_status";