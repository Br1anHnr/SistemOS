import { pgTable, uuid, varchar, date, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const semesterStatusEnum = pgEnum("semester_status", [
  "PLANNED",
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
]);

export const semesters = pgTable("semesters", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  academicYear: varchar("academic_year", { length: 10 }).notNull(),
  academicTerm: varchar("academic_term", { length: 20 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: semesterStatusEnum("status").notNull().default("PLANNED"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
