CREATE TYPE "public"."exercise_attachment_type" AS ENUM('STATEMENT_IMAGE', 'STATEMENT_FILE', 'REFERENCE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."exercise_attempt_attachment_type" AS ENUM('SOLUTION_IMAGE', 'CORRECTION_IMAGE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."exercise_attempt_result" AS ENUM('CORRECT', 'PARTIALLY_CORRECT', 'INCORRECT', 'NOT_COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."exercise_status" AS ENUM('PENDING', 'RESOLVED', 'PARTIALLY_CORRECT', 'WRONG', 'REVIEW');--> statement-breakpoint
CREATE TABLE "exercise_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exercise_id" uuid NOT NULL,
	"type" "exercise_attachment_type" DEFAULT 'STATEMENT_IMAGE' NOT NULL,
	"file_path" text NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"caption" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_attempt_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"type" "exercise_attempt_attachment_type" DEFAULT 'SOLUTION_IMAGE' NOT NULL,
	"file_path" text NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"caption" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exercise_id" uuid NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"result" "exercise_attempt_result" DEFAULT 'CORRECT' NOT NULL,
	"duration_minutes" integer,
	"difficulty_perceived" integer,
	"notes" text,
	"needs_review" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exercise_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"assessment_id" uuid,
	"title" varchar(200) NOT NULL,
	"description" text,
	"due_date" date,
	"source_file_name" varchar(255),
	"source_file_url" text,
	"source_file_type" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"exercise_set_id" uuid,
	"topic_id" uuid,
	"title" varchar(200) NOT NULL,
	"reference_number" varchar(50),
	"statement" text,
	"source" varchar(200),
	"source_page" integer,
	"difficulty" integer DEFAULT 3,
	"status" "exercise_status" DEFAULT 'PENDING' NOT NULL,
	"needs_review" boolean DEFAULT false NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "exercise_attachments" ADD CONSTRAINT "exercise_attachments_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_attempt_attachments" ADD CONSTRAINT "exercise_attempt_attachments_attempt_id_exercise_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."exercise_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_attempts" ADD CONSTRAINT "exercise_attempts_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_sets" ADD CONSTRAINT "exercise_sets_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_sets" ADD CONSTRAINT "exercise_sets_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_exercise_set_id_exercise_sets_id_fk" FOREIGN KEY ("exercise_set_id") REFERENCES "public"."exercise_sets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;