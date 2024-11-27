ALTER TABLE "requests" RENAME COLUMN "request_id" TO "parent_id";--> statement-breakpoint
ALTER TABLE "objects" ALTER COLUMN "request_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "response" text;