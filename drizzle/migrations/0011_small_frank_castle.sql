CREATE TYPE "public"."action_type" AS ENUM('system', 'user', 'workflow');--> statement-breakpoint
CREATE TYPE "public"."function_call_status" AS ENUM('ready_for_approval', 'running', 'completed');--> statement-breakpoint
ALTER TABLE "actions" ALTER COLUMN "type" SET DATA TYPE action_type;--> statement-breakpoint
ALTER TABLE "function_calls" ALTER COLUMN "status" SET DATA TYPE function_call_status;