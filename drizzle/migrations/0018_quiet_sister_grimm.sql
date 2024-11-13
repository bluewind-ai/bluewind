ALTER TABLE "requests" DROP CONSTRAINT "requests_request_id_unique";--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN IF EXISTS "request_id";