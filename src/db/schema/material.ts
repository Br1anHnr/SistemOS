import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { subjects } from "./subject";
import { topics } from "./topic";

export const subjectMaterials = pgTable("subject_materials", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),

  topicId: uuid("topic_id").references(() => topics.id, {
    onDelete: "set null",
  }),

  title: text("title").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull().default("PDF"),
  fileUrl: text("file_url").notNull(), // Base64 data URL, static path or Supabase Storage URL
  fileSize: integer("file_size"), // in bytes

  pageCount: integer("page_count"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
