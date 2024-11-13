CREATE TABLE IF NOT EXISTS "requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" uuid NOT NULL,
	CONSTRAINT "requests_request_id_unique" UNIQUE("request_id")
);
