import {
  pgTable,
  uuid,
  date,
  time,
  integer,
  text,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { subjects } from "./subject";
import { subjectSchedules } from "./schedule";

export const classSessionStatusEnum = pgEnum("class_session_status", [
  "SCHEDULED",
  "HELD",
  "CANCELED",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "PRESENT",
  "ABSENT",
  "PARTIAL",
  "EXCUSED",
  "NOT_RECORDED",
]);

export const classSessions = pgTable("class_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  scheduleId: uuid("schedule_id").references(() => subjectSchedules.id, {
    onDelete: "set null",
  }),

  date: date("date").notNull(),

  startTime: time("start_time"),
  endTime: time("end_time"),

  absenceUnits: integer("absence_units").notNull().default(1),

  status: classSessionStatusEnum("status").notNull().default("SCHEDULED"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const attendances = pgTable("attendances", {
  id: uuid("id").defaultRandom().primaryKey(),
  classSessionId: uuid("class_session_id")
    .notNull()
    .references(() => classSessions.id, { onDelete: "cascade" })
    .unique(),

  status: attendanceStatusEnum("status").notNull().default("NOT_RECORDED"),

  absentUnits: integer("absent_units").notNull().default(0),

  notes: text("notes"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
