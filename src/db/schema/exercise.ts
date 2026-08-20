import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  doublePrecision,
  boolean,
  date,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { subjects } from "./subject";
import { assessments } from "./assessment";
import { topics } from "./topic";
import { subjectMaterials } from "./material";

// Status of an exercise
export const exerciseStatusEnum = pgEnum("exercise_status", [
  "PENDING",
  "RESOLVED",
  "PARTIALLY_CORRECT",
  "WRONG",
  "REVIEW",
]);

// Attachment types for exercise statement or reference
export const exerciseAttachmentTypeEnum = pgEnum("exercise_attachment_type", [
  "STATEMENT_IMAGE",
  "STATEMENT_FILE",
  "REFERENCE",
  "OTHER",
]);

// Attempt results
export const exerciseAttemptResultEnum = pgEnum("exercise_attempt_result", [
  "CORRECT",
  "PARTIALLY_CORRECT",
  "INCORRECT",
  "NOT_COMPLETED",
]);

// Attachment types for resolution / notebook photo
export const exerciseAttemptAttachmentTypeEnum = pgEnum(
  "exercise_attempt_attachment_type",
  ["SOLUTION_IMAGE", "CORRECTION_IMAGE", "OTHER"]
);

// 1. Exercise Sets (Listas de Exercícios)
export const exerciseSets = pgTable("exercise_sets", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),

  // Optional link to an assessment (e.g. "Lista para P1" -> P1)
  assessmentId: uuid("assessment_id").references(() => assessments.id, {
    onDelete: "set null",
  }),

  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  dueDate: date("due_date"),

  // Original list source file (PDF or image)
  sourceFileName: varchar("source_file_name", { length: 255 }),
  sourceFileUrl: text("source_file_url"),
  sourceFileType: varchar("source_file_type", { length: 50 }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

// 2. Exercises (Exercícios)
export const exercises = pgTable("exercises", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),

  // Optional link to an Exercise Set (null if standalone / avulso)
  exerciseSetId: uuid("exercise_set_id").references(() => exerciseSets.id, {
    onDelete: "set null",
  }),

  // Optional link to a Topic/Chapter
  topicId: uuid("topic_id").references(() => topics.id, {
    onDelete: "set null",
  }),

  title: varchar("title", { length: 200 }).notNull(),
  referenceNumber: varchar("reference_number", { length: 50 }), // e.g. "Q01", "3.14"
  statement: text("statement"), // Description / Text problem statement
  source: varchar("source", { length: 200 }), // e.g. "Halliday Vol 2"
  sourcePage: integer("source_page"),
  difficulty: integer("difficulty").default(3), // 1 to 5

  status: exerciseStatusEnum("status").notNull().default("PENDING"),
  needsReview: boolean("needs_review").notNull().default(false),
  orderIndex: integer("order_index").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
});

// 3. Exercise Attachments (Enunciado, Fotos do Enunciado, Arquivos)
export const exerciseAttachments = pgTable("exercise_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),

  type: exerciseAttachmentTypeEnum("type").notNull().default("STATEMENT_IMAGE"),
  filePath: text("file_path").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  caption: text("caption"),
  orderIndex: integer("order_index").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 4. Exercise Attempts (Tentativas de Resolução)
export const exerciseAttempts = pgTable("exercise_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),

  attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
  result: exerciseAttemptResultEnum("result").notNull().default("CORRECT"),
  durationMinutes: integer("duration_minutes"),
  difficultyPerceived: integer("difficulty_perceived"), // 1 to 5
  notes: text("notes"),
  needsReview: boolean("needs_review").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 5. Exercise Attempt Attachments (Fotos da Resolução no Caderno)
export const exerciseAttemptAttachments = pgTable("exercise_attempt_attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  attemptId: uuid("attempt_id")
    .notNull()
    .references(() => exerciseAttempts.id, { onDelete: "cascade" }),

  type: exerciseAttemptAttachmentTypeEnum("type").notNull().default("SOLUTION_IMAGE"),
  filePath: text("file_path").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  caption: text("caption"), // e.g. "Página 1 do caderno", "Continuação"
  orderIndex: integer("order_index").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// 6. Exercise Source Regions (Trechos recortados do PDF/Material da Lista)
export const exerciseSourceRegions = pgTable("exercise_source_regions", {
  id: uuid("id").defaultRandom().primaryKey(),
  exerciseId: uuid("exercise_id")
    .notNull()
    .references(() => exercises.id, { onDelete: "cascade" }),

  // Optional link to material if uploaded as subject material
  materialId: uuid("material_id").references(() => subjectMaterials.id, {
    onDelete: "set null",
  }),

  pageNumber: integer("page_number").notNull().default(1),
  x: doublePrecision("x").notNull(),
  y: doublePrecision("y").notNull(),
  width: doublePrecision("width").notNull(),
  height: doublePrecision("height").notNull(),
  orderIndex: integer("order_index").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

