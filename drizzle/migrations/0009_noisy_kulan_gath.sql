CREATE TABLE IF NOT EXISTS "apps" (
	"id" serial PRIMARY KEY NOT NULL,
	"value" varchar(50) NOT NULL,
	"label" varchar(50) NOT NULL,
	"icon_key" varchar(50) NOT NULL,
	"order" integer NOT NULL,
	CONSTRAINT "apps_value_unique" UNIQUE("value")
);
