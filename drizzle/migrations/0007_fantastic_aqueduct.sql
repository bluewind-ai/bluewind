CREATE TABLE IF NOT EXISTS "raw_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"json_content" json NOT NULL,
	"request_id" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "raw_data" ADD CONSTRAINT "raw_data_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
