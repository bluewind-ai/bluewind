ALTER TABLE "requests" ALTER COLUMN "cache_status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "duration_ms" integer;