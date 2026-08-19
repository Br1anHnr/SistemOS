CREATE TYPE "public"."pdf_anchor_type" AS ENUM('POINT', 'REGION');--> statement-breakpoint
ALTER TYPE "public"."topic_note_type" ADD VALUE 'EXAM';--> statement-breakpoint
CREATE TABLE "pdf_note_anchors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"material_id" uuid,
	"page_number" integer NOT NULL,
	"anchor_type" "pdf_anchor_type" DEFAULT 'POINT' NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pdf_note_anchors" ADD CONSTRAINT "pdf_note_anchors_note_id_topic_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."topic_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdf_note_anchors" ADD CONSTRAINT "pdf_note_anchors_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdf_note_anchors" ADD CONSTRAINT "pdf_note_anchors_material_id_subject_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."subject_materials"("id") ON DELETE cascade ON UPDATE no action;