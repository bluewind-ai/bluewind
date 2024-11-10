CREATE TABLE IF NOT EXISTS "objects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model" text NOT NULL,
	"record_id" uuid NOT NULL
);
