import {
  pgTable,
  uuid,
  varchar,
  integer,
  real,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { semesters } from "./semester";

export const subjectStatusEnum = pgEnum("subject_status", [
  "ACTIVE",
  "COMPLETED",
  "FAILED",
  "DROPPED",
  "ARCHIVED",
]);

export const subjects = pgTable("subjects", {
  id: uuid("id").defaultRandom().primaryKey(),
  semesterId: uuid("semester_id")
    .notNull()
    .references(() => semesters.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 200 }).notNull(),
  code: varchar("code", { length: 30 }),
  professor: varchar("professor", { length: 200 }),
  room: varchar("room", { length: 50 }),

  workloadHours: integer("workload_hours"),

  minimumAttendancePercentage: real("minimum_attendance_percentage")
    .notNull()
    .default(75),
  personalDifficulty: integer("personal_difficulty").notNull().default(3),

  color: varchar("color", { length: 9 }),
  status: subjectStatusEnum("status").notNull().default("ACTIVE"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});
