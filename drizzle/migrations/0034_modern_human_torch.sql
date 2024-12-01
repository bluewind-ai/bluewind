ALTER TABLE "requests" ADD COLUMN "nodes" jsonb;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "edges" jsonb;--> statement-breakpoint
ALTER TABLE "requests" DROP COLUMN IF EXISTS "tree";