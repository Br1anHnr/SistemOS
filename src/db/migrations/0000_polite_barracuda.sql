CREATE TYPE "public"."assessment_status" AS ENUM('SCHEDULED', 'COMPLETED', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."assessment_type" AS ENUM('EXAM', 'FINAL_EXAM', 'ASSIGNMENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('PRESENT', 'ABSENT', 'PARTIAL', 'EXCUSED', 'NOT_RECORDED');--> statement-breakpoint
CREATE TYPE "public"."class_session_status" AS ENUM('SCHEDULED', 'HELD', 'CANCELED');--> statement-breakpoint
CREATE TYPE "public"."rounding_mode" AS ENUM('ROUND_HALF_UP', 'ROUND_DOWN', 'ROUND_UP', 'NONE');--> statement-breakpoint
CREATE TYPE "public"."semester_status" AS ENUM('PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."subject_status" AS ENUM('ACTIVE', 'COMPLETED', 'FAILED', 'DROPPED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "assessment_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"grade" real NOT NULL,
	"graded_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assessment_results_assessment_id_unique" UNIQUE("assessment_id")
);
--> statement-breakpoint
CREATE TABLE "assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"grade_component_id" uuid,
	"title" varchar(200) NOT NULL,
	"type" "assessment_type" NOT NULL,
	"date" date,
	"max_grade" real DEFAULT 10 NOT NULL,
	"status" "assessment_status" DEFAULT 'SCHEDULED' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_session_id" uuid NOT NULL,
	"status" "attendance_status" DEFAULT 'NOT_RECORDED' NOT NULL,
	"absent_units" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendances_class_session_id_unique" UNIQUE("class_session_id")
);
--> statement-breakpoint
CREATE TABLE "class_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"schedule_id" uuid,
	"date" date NOT NULL,
	"start_time" time,
	"end_time" time,
	"absence_units" integer DEFAULT 1 NOT NULL,
	"status" "class_session_status" DEFAULT 'SCHEDULED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grade_components" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grading_scheme_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"code" varchar(10) NOT NULL,
	"weight" real DEFAULT 1 NOT NULL,
	"max_grade" real DEFAULT 10 NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"is_exam" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grading_schemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"passing_grade" real DEFAULT 5 NOT NULL,
	"exam_enabled" boolean DEFAULT true NOT NULL,
	"exam_trigger_threshold" real DEFAULT 5 NOT NULL,
	"rounding_mode" "rounding_mode" DEFAULT 'ROUND_HALF_UP' NOT NULL,
	"decimal_places" integer DEFAULT 2 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grading_schemes_subject_id_unique" UNIQUE("subject_id")
);
--> statement-breakpoint
CREATE TABLE "semesters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"academic_year" varchar(10) NOT NULL,
	"academic_term" varchar(20) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "semester_status" DEFAULT 'PLANNED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subject_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"room" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"semester_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"code" varchar(30),
	"professor" varchar(200),
	"room" varchar(50),
	"workload_hours" integer,
	"minimum_attendance_percentage" real DEFAULT 75 NOT NULL,
	"personal_difficulty" integer DEFAULT 3 NOT NULL,
	"color" varchar(9),
	"status" "subject_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "assessment_results" ADD CONSTRAINT "assessment_results_assessment_id_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_grade_component_id_grade_components_id_fk" FOREIGN KEY ("grade_component_id") REFERENCES "public"."grade_components"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_class_session_id_class_sessions_id_fk" FOREIGN KEY ("class_session_id") REFERENCES "public"."class_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_schedule_id_subject_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."subject_schedules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_components" ADD CONSTRAINT "grade_components_grading_scheme_id_grading_schemes_id_fk" FOREIGN KEY ("grading_scheme_id") REFERENCES "public"."grading_schemes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grading_schemes" ADD CONSTRAINT "grading_schemes_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_schedules" ADD CONSTRAINT "subject_schedules_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_semester_id_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE cascade ON UPDATE no action;