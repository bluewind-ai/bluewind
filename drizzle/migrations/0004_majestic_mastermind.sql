ALTER TABLE "objects" ADD COLUMN "model_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "objects" ADD CONSTRAINT "objects_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
