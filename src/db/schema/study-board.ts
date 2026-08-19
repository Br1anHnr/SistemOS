import {
  pgTable,
  uuid,
  text,
  real,
  integer,
  jsonb,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { topics } from "./topic";

export const studyBoardItemTypeEnum = pgEnum("study_board_item_type", [
  "TEXT",
  "NOTE",
  "DRAWING",
  "ARROW",
  "PDF_REGION",
]);

export const studyBoards = pgTable("study_boards", {
  id: uuid("id").defaultRandom().primaryKey(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),

  name: text("name").notNull().default("Lousa Principal"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const studyBoardItems = pgTable("study_board_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  boardId: uuid("board_id")
    .notNull()
    .references(() => studyBoards.id, { onDelete: "cascade" }),

  type: studyBoardItemTypeEnum("type").notNull(),
  data: jsonb("data").notNull(),

  x: real("x").notNull().default(0),
  y: real("y").notNull().default(0),
  width: real("width").notNull().default(200),
  height: real("height").notNull().default(150),
  zIndex: integer("z_index").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
