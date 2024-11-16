CREATE TABLE IF NOT EXISTS "models" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"plural_name" text NOT NULL,
	"singular_name" text NOT NULL
);
