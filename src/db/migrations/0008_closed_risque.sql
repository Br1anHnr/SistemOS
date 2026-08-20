CREATE TABLE "exercise_source_regions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exercise_id" uuid NOT NULL,
	"material_id" uuid,
	"page_number" integer DEFAULT 1 NOT NULL,
	"x" double precision NOT NULL,
	"y" double precision NOT NULL,
	"width" double precision NOT NULL,
	"height" double precision NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercise_source_regions" ADD CONSTRAINT "exercise_source_regions_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_source_regions" ADD CONSTRAINT "exercise_source_regions_material_id_subject_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."subject_materials"("id") ON DELETE set null ON UPDATE no action;