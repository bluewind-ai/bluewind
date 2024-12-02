CREATE TYPE "public"."route_type" AS ENUM('SYSTEM', 'API');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "route_type" NOT NULL,
	"hash" text NOT NULL,
	"request_id" integer NOT NULL,
	"metadata" jsonb,
	"created_location" text NOT NULL,
	CONSTRAINT "routes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "routes" ADD CONSTRAINT "routes_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
