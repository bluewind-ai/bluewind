ALTER TABLE "objects" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN "created_location" text NOT NULL;