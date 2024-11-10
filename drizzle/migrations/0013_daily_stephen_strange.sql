ALTER TABLE "objects" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "objects" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "objects" ALTER COLUMN "record_id" SET DATA TYPE integer;