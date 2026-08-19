import { db } from "@/db";
import {
  exerciseSets,
  exercises,
  exerciseAttachments,
  exerciseAttempts,
  exerciseAttemptAttachments,
  subjects,
  topics,
  assessments,
} from "@/db/schema";
import { eq, and, asc, desc, isNull } from "drizzle-orm";
import {
  ExerciseSetItem,
  ExerciseItem,
  ExerciseAttemptItem,
  calculateExerciseDerivedStatus,
  calculateExerciseSetProgress,
} from "@/domain/exercises";
import {
  createExerciseSetSchema,
  updateExerciseSetSchema,
  createExerciseSchema,
  updateExerciseSchema,
  createExerciseAttemptSchema,
} from "@/validations";
import { z } from "zod";

// ─── EXERCISE SETS (LISTAS) ──────────────────────────────────────────────────

export async function getExerciseSetsBySubjectId(
  subjectId: string
): Promise<ExerciseSetItem[]> {
  const sets = await db
    .select({
      id: exerciseSets.id,
      subjectId: exerciseSets.subjectId,
      assessmentId: exerciseSets.assessmentId,
      title: exerciseSets.title,
      description: exerciseSets.description,
      dueDate: exerciseSets.dueDate,
      sourceFileName: exerciseSets.sourceFileName,
      sourceFileUrl: exerciseSets.sourceFileUrl,
      sourceFileType: exerciseSets.sourceFileType,
      createdAt: exerciseSets.createdAt,
      updatedAt: exerciseSets.updatedAt,
      archivedAt: exerciseSets.archivedAt,
      assessmentTitle: assessments.title,
      assessmentDate: assessments.date,
    })
    .from(exerciseSets)
    .leftJoin(assessments, eq(exerciseSets.assessmentId, assessments.id))
    .where(eq(exerciseSets.subjectId, subjectId))
    .orderBy(asc(exerciseSets.createdAt));

  // Fetch all exercises for this subject to compute set progress
  const allSubjectExercises = await getExercisesBySubjectId(subjectId);

  return sets.map((set) => {
    const setExercises = allSubjectExercises.filter((e) => e.exerciseSetId === set.id);
    const progress = calculateExerciseSetProgress(setExercises);

    return {
      ...set,
      exercises: setExercises,
      progress,
    };
  });
}

export async function getExerciseSetById(
  id: string,
  subjectId: string
): Promise<ExerciseSetItem | null> {
  const [set] = await db
    .select({
      id: exerciseSets.id,
      subjectId: exerciseSets.subjectId,
      assessmentId: exerciseSets.assessmentId,
      title: exerciseSets.title,
      description: exerciseSets.description,
      dueDate: exerciseSets.dueDate,
      sourceFileName: exerciseSets.sourceFileName,
      sourceFileUrl: exerciseSets.sourceFileUrl,
      sourceFileType: exerciseSets.sourceFileType,
      createdAt: exerciseSets.createdAt,
      updatedAt: exerciseSets.updatedAt,
      archivedAt: exerciseSets.archivedAt,
      assessmentTitle: assessments.title,
      assessmentDate: assessments.date,
    })
    .from(exerciseSets)
    .leftJoin(assessments, eq(exerciseSets.assessmentId, assessments.id))
    .where(and(eq(exerciseSets.id, id), eq(exerciseSets.subjectId, subjectId)));

  if (!set) return null;

  const setExercises = await getExercisesBySubjectId(subjectId, { exerciseSetId: set.id });
  const progress = calculateExerciseSetProgress(setExercises);

  return {
    ...set,
    exercises: setExercises,
    progress,
  };
}

export async function createExerciseSet(
  data: z.infer<typeof createExerciseSetSchema>
) {
  // Validate subject existence
  const [subject] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.id, data.subjectId));

  if (!subject) {
    throw new Error("Disciplina não encontrada.");
  }

  // Validate assessment relational scope
  if (data.assessmentId) {
    const [assessment] = await db
      .select({ id: assessments.id })
      .from(assessments)
      .where(
        and(
          eq(assessments.id, data.assessmentId),
          eq(assessments.subjectId, data.subjectId)
        )
      );

    if (!assessment) {
      throw new Error("A avaliação vinculada não pertence a esta disciplina.");
    }
  }

  const [created] = await db
    .insert(exerciseSets)
    .values({
      subjectId: data.subjectId,
      assessmentId: data.assessmentId || null,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      dueDate: data.dueDate || null,
      sourceFileName: data.sourceFileName || null,
      sourceFileUrl: data.sourceFileUrl || null,
      sourceFileType: data.sourceFileType || "PDF",
      updatedAt: new Date(),
    })
    .returning();

  return created;
}

export async function updateExerciseSet(
  id: string,
  subjectId: string,
  data: z.infer<typeof updateExerciseSetSchema>
) {
  if (data.assessmentId) {
    const [assessment] = await db
      .select({ id: assessments.id })
      .from(assessments)
      .where(
        and(
          eq(assessments.id, data.assessmentId),
          eq(assessments.subjectId, subjectId)
        )
      );

    if (!assessment) {
      throw new Error("A avaliação vinculada não pertence a esta disciplina.");
    }
  }

  const [updated] = await db
    .update(exerciseSets)
    .set({
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description?.trim() || null } : {}),
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate || null } : {}),
      ...(data.assessmentId !== undefined ? { assessmentId: data.assessmentId || null } : {}),
      ...(data.sourceFileName !== undefined ? { sourceFileName: data.sourceFileName } : {}),
      ...(data.sourceFileUrl !== undefined ? { sourceFileUrl: data.sourceFileUrl } : {}),
      ...(data.sourceFileType !== undefined ? { sourceFileType: data.sourceFileType } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(exerciseSets.id, id), eq(exerciseSets.subjectId, subjectId)))
    .returning();

  return updated;
}

export async function deleteExerciseSet(id: string, subjectId: string) {
  const [deleted] = await db
    .delete(exerciseSets)
    .where(and(eq(exerciseSets.id, id), eq(exerciseSets.subjectId, subjectId)))
    .returning();

  return deleted;
}

// ─── EXERCISES ───────────────────────────────────────────────────────────────

export async function getExercisesBySubjectId(
  subjectId: string,
  filters?: {
    topicId?: string;
    exerciseSetId?: string;
    standaloneOnly?: boolean;
  }
): Promise<ExerciseItem[]> {
  const conditions = [eq(exercises.subjectId, subjectId)];

  if (filters?.topicId) {
    conditions.push(eq(exercises.topicId, filters.topicId));
  }

  if (filters?.exerciseSetId) {
    conditions.push(eq(exercises.exerciseSetId, filters.exerciseSetId));
  } else if (filters?.standaloneOnly) {
    conditions.push(isNull(exercises.exerciseSetId));
  }

  const list = await db
    .select({
      id: exercises.id,
      subjectId: exercises.subjectId,
      exerciseSetId: exercises.exerciseSetId,
      topicId: exercises.topicId,
      title: exercises.title,
      referenceNumber: exercises.referenceNumber,
      statement: exercises.statement,
      source: exercises.source,
      sourcePage: exercises.sourcePage,
      difficulty: exercises.difficulty,
      status: exercises.status,
      needsReview: exercises.needsReview,
      orderIndex: exercises.orderIndex,
      createdAt: exercises.createdAt,
      updatedAt: exercises.updatedAt,
      archivedAt: exercises.archivedAt,
      topicTitle: topics.title,
      exerciseSetTitle: exerciseSets.title,
      assessmentTitle: assessments.title,
    })
    .from(exercises)
    .leftJoin(topics, eq(exercises.topicId, topics.id))
    .leftJoin(exerciseSets, eq(exercises.exerciseSetId, exerciseSets.id))
    .leftJoin(assessments, eq(exerciseSets.assessmentId, assessments.id))
    .where(and(...conditions))
    .orderBy(asc(exercises.orderIndex), asc(exercises.createdAt));

  // Fetch all attempts for these exercises
  const allAttempts = await db
    .select()
    .from(exerciseAttempts)
    .orderBy(desc(exerciseAttempts.attemptedAt));

  // Fetch attempt attachments
  const allAttemptAttachments = await db
    .select()
    .from(exerciseAttemptAttachments)
    .orderBy(asc(exerciseAttemptAttachments.orderIndex));

  // Fetch statement attachments
  const allStatementAttachments = await db
    .select()
    .from(exerciseAttachments)
    .orderBy(asc(exerciseAttachments.orderIndex));

  return list.map((ex) => {
    const exAttempts = allAttempts
      .filter((a) => a.exerciseId === ex.id)
      .map((att) => ({
        ...att,
        attachments: allAttemptAttachments.filter((aa) => aa.attemptId === att.id),
      }));

    const exAttachments = allStatementAttachments.filter((sa) => sa.exerciseId === ex.id);
    const derivedStatus = calculateExerciseDerivedStatus(exAttempts, ex.needsReview);

    return {
      ...ex,
      status: derivedStatus,
      attempts: exAttempts as ExerciseAttemptItem[],
      attachments: exAttachments,
    };
  });
}

export async function getExercisesByTopicId(
  topicId: string,
  subjectId: string
): Promise<ExerciseItem[]> {
  return getExercisesBySubjectId(subjectId, { topicId });
}

export async function getExerciseById(
  id: string,
  subjectId: string
): Promise<ExerciseItem | null> {
  const [ex] = await db
    .select({
      id: exercises.id,
      subjectId: exercises.subjectId,
      exerciseSetId: exercises.exerciseSetId,
      topicId: exercises.topicId,
      title: exercises.title,
      referenceNumber: exercises.referenceNumber,
      statement: exercises.statement,
      source: exercises.source,
      sourcePage: exercises.sourcePage,
      difficulty: exercises.difficulty,
      status: exercises.status,
      needsReview: exercises.needsReview,
      orderIndex: exercises.orderIndex,
      createdAt: exercises.createdAt,
      updatedAt: exercises.updatedAt,
      archivedAt: exercises.archivedAt,
      topicTitle: topics.title,
      exerciseSetTitle: exerciseSets.title,
      assessmentTitle: assessments.title,
    })
    .from(exercises)
    .leftJoin(topics, eq(exercises.topicId, topics.id))
    .leftJoin(exerciseSets, eq(exercises.exerciseSetId, exerciseSets.id))
    .leftJoin(assessments, eq(exerciseSets.assessmentId, assessments.id))
    .where(and(eq(exercises.id, id), eq(exercises.subjectId, subjectId)));

  if (!ex) return null;

  const attempts = await db
    .select()
    .from(exerciseAttempts)
    .where(eq(exerciseAttempts.exerciseId, id))
    .orderBy(desc(exerciseAttempts.attemptedAt));

  const attemptAttachments = await db
    .select()
    .from(exerciseAttemptAttachments)
    .orderBy(asc(exerciseAttemptAttachments.orderIndex));

  const statementAttachments = await db
    .select()
    .from(exerciseAttachments)
    .where(eq(exerciseAttachments.exerciseId, id))
    .orderBy(asc(exerciseAttachments.orderIndex));

  const populatedAttempts = attempts.map((att) => ({
    ...att,
    attachments: attemptAttachments.filter((aa) => aa.attemptId === att.id),
  }));

  const derivedStatus = calculateExerciseDerivedStatus(populatedAttempts, ex.needsReview);

  return {
    ...ex,
    status: derivedStatus,
    attempts: populatedAttempts as ExerciseAttemptItem[],
    attachments: statementAttachments,
  };
}

export async function createExercise(
  data: z.infer<typeof createExerciseSchema>
) {
  // Validate subject existence
  const [subject] = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.id, data.subjectId));

  if (!subject) {
    throw new Error("Disciplina não encontrada.");
  }

  // Validate topic relational scope
  if (data.topicId) {
    const [topic] = await db
      .select({ id: topics.id })
      .from(topics)
      .where(and(eq(topics.id, data.topicId), eq(topics.subjectId, data.subjectId)));

    if (!topic) {
      throw new Error("O capítulo vinculado não pertence a esta disciplina.");
    }
  }

  // Validate exercise set relational scope
  if (data.exerciseSetId) {
    const [set] = await db
      .select({ id: exerciseSets.id })
      .from(exerciseSets)
      .where(
        and(
          eq(exerciseSets.id, data.exerciseSetId),
          eq(exerciseSets.subjectId, data.subjectId)
        )
      );

    if (!set) {
      throw new Error("A lista de exercícios vinculada não pertence a esta disciplina.");
    }
  }

  const [created] = await db
    .insert(exercises)
    .values({
      subjectId: data.subjectId,
      exerciseSetId: data.exerciseSetId || null,
      topicId: data.topicId || null,
      title: data.title.trim(),
      referenceNumber: data.referenceNumber?.trim() || null,
      statement: data.statement?.trim() || null,
      source: data.source?.trim() || null,
      sourcePage: data.sourcePage ?? null,
      difficulty: data.difficulty ?? 3,
      needsReview: data.needsReview ?? false,
      orderIndex: data.orderIndex ?? 0,
      updatedAt: new Date(),
    })
    .returning();

  // Attach statement images if provided
  if (data.statementImages && data.statementImages.length > 0) {
    await db.insert(exerciseAttachments).values(
      data.statementImages.map((img, idx) => ({
        exerciseId: created.id,
        type: "STATEMENT_IMAGE" as const,
        filePath: img.filePath,
        mimeType: img.mimeType || "image/png",
        originalName: img.originalName,
        caption: img.caption || null,
        orderIndex: idx,
      }))
    );
  }

  return created;
}

export async function updateExercise(
  id: string,
  subjectId: string,
  data: z.infer<typeof updateExerciseSchema>
) {
  if (data.topicId) {
    const [topic] = await db
      .select({ id: topics.id })
      .from(topics)
      .where(and(eq(topics.id, data.topicId), eq(topics.subjectId, subjectId)));

    if (!topic) {
      throw new Error("O capítulo vinculado não pertence a esta disciplina.");
    }
  }

  if (data.exerciseSetId) {
    const [set] = await db
      .select({ id: exerciseSets.id })
      .from(exerciseSets)
      .where(
        and(
          eq(exerciseSets.id, data.exerciseSetId),
          eq(exerciseSets.subjectId, subjectId)
        )
      );

    if (!set) {
      throw new Error("A lista de exercícios vinculada não pertence a esta disciplina.");
    }
  }

  const [updated] = await db
    .update(exercises)
    .set({
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.referenceNumber !== undefined ? { referenceNumber: data.referenceNumber?.trim() || null } : {}),
      ...(data.statement !== undefined ? { statement: data.statement?.trim() || null } : {}),
      ...(data.source !== undefined ? { source: data.source?.trim() || null } : {}),
      ...(data.sourcePage !== undefined ? { sourcePage: data.sourcePage ?? null } : {}),
      ...(data.difficulty !== undefined ? { difficulty: data.difficulty ?? 3 } : {}),
      ...(data.topicId !== undefined ? { topicId: data.topicId || null } : {}),
      ...(data.exerciseSetId !== undefined ? { exerciseSetId: data.exerciseSetId || null } : {}),
      ...(data.needsReview !== undefined ? { needsReview: data.needsReview } : {}),
      ...(data.orderIndex !== undefined ? { orderIndex: data.orderIndex } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(exercises.id, id), eq(exercises.subjectId, subjectId)))
    .returning();

  return updated;
}

export async function deleteExercise(id: string, subjectId: string) {
  const [deleted] = await db
    .delete(exercises)
    .where(and(eq(exercises.id, id), eq(exercises.subjectId, subjectId)))
    .returning();

  return deleted;
}

export async function toggleExerciseNeedsReview(
  id: string,
  subjectId: string,
  needsReview: boolean
) {
  const [updated] = await db
    .update(exercises)
    .set({
      needsReview,
      updatedAt: new Date(),
    })
    .where(and(eq(exercises.id, id), eq(exercises.subjectId, subjectId)))
    .returning();

  return updated;
}

// ─── ATTEMPTS & RESOLUTION ATTACHMENTS ───────────────────────────────────────

export async function createExerciseAttempt(
  data: z.infer<typeof createExerciseAttemptSchema>,
  subjectId?: string
) {
  // Validate exercise
  const [ex] = await db
    .select({ id: exercises.id, subjectId: exercises.subjectId })
    .from(exercises)
    .where(eq(exercises.id, data.exerciseId));

  if (!ex) {
    throw new Error("Exercício não encontrado.");
  }

  if (subjectId && ex.subjectId !== subjectId) {
    throw new Error("O exercício não pertence a esta disciplina.");
  }

  const [attempt] = await db
    .insert(exerciseAttempts)
    .values({
      exerciseId: data.exerciseId,
      attemptedAt: data.attemptedAt ? new Date(data.attemptedAt) : new Date(),
      result: data.result,
      durationMinutes: data.durationMinutes ?? null,
      difficultyPerceived: data.difficultyPerceived ?? null,
      notes: data.notes?.trim() || null,
      needsReview: data.needsReview ?? false,
      updatedAt: new Date(),
    })
    .returning();

  // Attach resolution photos if provided
  if (data.attachments && data.attachments.length > 0) {
    await db.insert(exerciseAttemptAttachments).values(
      data.attachments.map((att, idx) => ({
        attemptId: attempt.id,
        type: att.type || "SOLUTION_IMAGE",
        filePath: att.filePath,
        mimeType: att.mimeType || "image/png",
        originalName: att.originalName,
        caption: att.caption || null,
        orderIndex: idx,
      }))
    );
  }

  // Update exercise needsReview and updatedAt
  await db
    .update(exercises)
    .set({
      needsReview: data.needsReview ?? false,
      updatedAt: new Date(),
    })
    .where(eq(exercises.id, data.exerciseId));

  return attempt;
}

export async function deleteExerciseAttempt(attemptId: string) {
  const [deleted] = await db
    .delete(exerciseAttempts)
    .where(eq(exerciseAttempts.id, attemptId))
    .returning();

  return deleted;
}

export async function deleteExerciseAttachment(attachmentId: string) {
  const [deleted] = await db
    .delete(exerciseAttachments)
    .where(eq(exerciseAttachments.id, attachmentId))
    .returning();

  return deleted;
}

export async function deleteAttemptAttachment(attachmentId: string) {
  const [deleted] = await db
    .delete(exerciseAttemptAttachments)
    .where(eq(exerciseAttemptAttachments.id, attachmentId))
    .returning();

  return deleted;
}
