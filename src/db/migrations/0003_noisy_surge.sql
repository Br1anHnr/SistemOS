CREATE TYPE "public"."material_bookmark_type" AS ENUM('BOOKMARK', 'IMPORTANT', 'EXAM', 'QUESTION');--> statement-breakpoint
CREATE TYPE "public"."topic_note_type" AS ENUM('NOTE', 'IMPORTANT', 'QUESTION', 'FORMULA');--> statement-breakpoint
CREATE TABLE "material_bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"material_id" uuid NOT NULL,
	"page_number" integer NOT NULL,
	"title" text NOT NULL,
	"type" "material_bookmark_type" DEFAULT 'BOOKMARK' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topic_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"material_id" uuid,
	"type" "topic_note_type" DEFAULT 'NOTE' NOT NULL,
	"content" text NOT NULL,
	"page_number" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "material_bookmarks" ADD CONSTRAINT "material_bookmarks_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "material_bookmarks" ADD CONSTRAINT "material_bookmarks_material_id_subject_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."subject_materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_notes" ADD CONSTRAINT "topic_notes_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_notes" ADD CONSTRAINT "topic_notes_material_id_subject_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."subject_materials"("id") ON DELETE set null ON UPDATE no action;