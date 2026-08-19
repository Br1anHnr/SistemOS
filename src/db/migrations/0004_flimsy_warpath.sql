CREATE TYPE "public"."pdf_annotation_type" AS ENUM('PEN', 'HIGHLIGHT', 'ARROW', 'TEXT', 'RECTANGLE');--> statement-breakpoint
CREATE TABLE "pdf_annotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"material_id" uuid,
	"page_number" integer NOT NULL,
	"type" "pdf_annotation_type" NOT NULL,
	"data" jsonb NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pdf_annotations" ADD CONSTRAINT "pdf_annotations_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdf_annotations" ADD CONSTRAINT "pdf_annotations_material_id_subject_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."subject_materials"("id") ON DELETE cascade ON UPDATE no action;