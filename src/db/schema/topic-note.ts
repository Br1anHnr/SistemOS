import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { topics } from "./topic";
import { subjectMaterials } from "./material";

export const topicNoteTypeEnum = pgEnum("topic_note_type", [
  "NOTE",
  "IMPORTANT",
  "QUESTION",
  "FORMULA",
]);

export const topicNotes = pgTable("topic_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),

  materialId: uuid("material_id").references(() => subjectMaterials.id, {
    onDelete: "set null",
  }),

  type: topicNoteTypeEnum("type").notNull().default("NOTE"),
  content: text("content").notNull(),
  pageNumber: integer("page_number"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
