ALTER TABLE "objects" ALTER COLUMN "model_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "objects" DROP COLUMN IF EXISTS "model";