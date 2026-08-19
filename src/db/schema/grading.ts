import {
  pgTable,
  uuid,
  real,
  boolean,
  integer,
  varchar,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { subjects } from "./subject";

export const roundingModeEnum = pgEnum("rounding_mode", [
  "ROUND_HALF_UP",
  "ROUND_DOWN",
  "ROUND_UP",
  "NONE",
]);

export const gradingSchemes = pgTable("grading_schemes", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" })
    .unique(),

  passingGrade: real("passing_grade").notNull().default(5),
  examEnabled: boolean("exam_enabled").notNull().default(true),
  examTriggerThreshold: real("exam_trigger_threshold").notNull().default(5),

  roundingMode: roundingModeEnum("rounding_mode").notNull().default("ROUND_HALF_UP"),
  decimalPlaces: integer("decimal_places").notNull().default(2),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const gradeComponents = pgTable("grade_components", {
  id: uuid("id").defaultRandom().primaryKey(),
  gradingSchemeId: uuid("grading_scheme_id")
    .notNull()
    .references(() => gradingSchemes.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 50 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  weight: real("weight").notNull().default(1),
  maxGrade: real("max_grade").notNull().default(10),
  orderIndex: integer("order_index").notNull().default(0),
  isExam: boolean("is_exam").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
