CREATE TYPE "public"."study_board_item_type" AS ENUM('TEXT', 'NOTE', 'DRAWING', 'ARROW', 'PDF_REGION');--> statement-breakpoint
CREATE TABLE "study_board_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"board_id" uuid NOT NULL,
	"type" "study_board_item_type" NOT NULL,
	"data" jsonb NOT NULL,
	"x" real DEFAULT 0 NOT NULL,
	"y" real DEFAULT 0 NOT NULL,
	"width" real DEFAULT 200 NOT NULL,
	"height" real DEFAULT 150 NOT NULL,
	"z_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"name" text DEFAULT 'Lousa Principal' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "study_board_items" ADD CONSTRAINT "study_board_items_board_id_study_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."study_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_boards" ADD CONSTRAINT "study_boards_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;