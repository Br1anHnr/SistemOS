import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { topics } from "./topic";
import { subjectMaterials } from "./material";

export const pdfAnnotationTypeEnum = pgEnum("pdf_annotation_type", [
  "PEN",
  "HIGHLIGHT",
  "ARROW",
  "TEXT",
  "RECTANGLE",
]);

export const pdfAnnotations = pgTable("pdf_annotations", {
  id: uuid("id").defaultRandom().primaryKey(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),

  materialId: uuid("material_id").references(() => subjectMaterials.id, {
    onDelete: "cascade",
  }),

  pageNumber: integer("page_number").notNull(),
  type: pdfAnnotationTypeEnum("type").notNull(),
  data: jsonb("data").notNull(),
  schemaVersion: integer("schema_version").notNull().default(1),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
