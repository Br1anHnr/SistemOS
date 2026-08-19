import {
  pgTable,
  uuid,
  integer,
  jsonb,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { topics } from "./topic";
import { subjectMaterials } from "./material";
import { topicNotes } from "./topic-note";

export const pdfAnchorTypeEnum = pgEnum("pdf_anchor_type", [
  "POINT",
  "REGION",
]);

export const pdfNoteAnchors = pgTable("pdf_note_anchors", {
  id: uuid("id").defaultRandom().primaryKey(),
  noteId: uuid("note_id")
    .notNull()
    .references(() => topicNotes.id, { onDelete: "cascade" }),

  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),

  materialId: uuid("material_id").references(() => subjectMaterials.id, {
    onDelete: "cascade",
  }),

  pageNumber: integer("page_number").notNull(),
  anchorType: pdfAnchorTypeEnum("anchor_type").notNull().default("POINT"),
  data: jsonb("data").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
