ALTER TABLE "function_calls" ALTER COLUMN "parent_id" SET DEFAULT CURRVAL('function_calls_id_seq');--> statement-breakpoint
ALTER TABLE "function_calls" ALTER COLUMN "parent_id" SET NOT NULL;