import {
  pgTable,
  uuid,
  integer,
  time,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { subjects } from "./subject";

export const subjectSchedules = pgTable("subject_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),

  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  room: varchar("room", { length: 50 }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
