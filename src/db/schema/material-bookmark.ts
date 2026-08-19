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

export const materialBookmarkTypeEnum = pgEnum("material_bookmark_type", [
  "BOOKMARK",
  "IMPORTANT",
  "EXAM",
  "QUESTION",
]);

export const materialBookmarks = pgTable("material_bookmarks", {
  id: uuid("id").defaultRandom().primaryKey(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),

  materialId: uuid("material_id")
    .notNull()
    .references(() => subjectMaterials.id, { onDelete: "cascade" }),

  pageNumber: integer("page_number").notNull(),
  title: text("title").notNull(),
  type: materialBookmarkTypeEnum("type").notNull().default("BOOKMARK"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
