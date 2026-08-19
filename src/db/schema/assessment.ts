import {
  pgTable,
  uuid,
  varchar,
  date,
  real,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { subjects } from "./subject";
import { gradeComponents } from "./grading";

export const assessmentTypeEnum = pgEnum("assessment_type", [
  "EXAM",
  "FINAL_EXAM",
  "ASSIGNMENT",
  "OTHER",
]);

export const assessmentStatusEnum = pgEnum("assessment_status", [
  "SCHEDULED",
  "COMPLETED",
  "CANCELED",
]);

export const assessments = pgTable("assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  gradeComponentId: uuid("grade_component_id").references(
    () => gradeComponents.id,
    { onDelete: "set null" }
  ),

  title: varchar("title", { length: 200 }).notNull(),
  type: assessmentTypeEnum("type").notNull(),

  date: date("date"),
  maxGrade: real("max_grade").notNull().default(10),

  status: assessmentStatusEnum("status").notNull().default("SCHEDULED"),
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assessmentResults = pgTable("assessment_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  assessmentId: uuid("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" })
    .unique(),

  grade: real("grade").notNull(),
  gradedAt: timestamp("graded_at", { withTimezone: true }),
  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
