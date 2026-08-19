import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { subjects } from "./subject";
import { assessments } from "./assessment";

export const topicStatusEnum = pgEnum("topic_status", [
  "NOT_STARTED",
  "IN_PROGRESS",
  "REVIEWED",
  "COMPLETED",
  "ARCHIVED",
]);

export const topics = pgTable("topics", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),

  title: text("title").notNull(),
  description: text("description"),

  orderIndex: integer("order_index").notNull().default(0),

  // Mastery level: 0 (Not studied / New) to 4 (Mastered / Practiced)
  masteryLevel: integer("mastery_level").notNull().default(0),

  // Importance / Weight within subject (1 to 5)
  importance: integer("importance").notNull().default(3),

  // Estimated hours to study / master
  estimatedHours: real("estimated_hours"),

  status: topicStatusEnum("status").notNull().default("NOT_STARTED"),

  // Optional link to an assessment (e.g. Topic tested on P1)
  assessmentId: uuid("assessment_id").references(() => assessments.id, {
    onDelete: "set null",
  }),

  completedAt: timestamp("completed_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
