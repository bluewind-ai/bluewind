ALTER TABLE "requests" ALTER COLUMN "duration_ms" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "request_size_bytes" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "response_size_bytes" integer;