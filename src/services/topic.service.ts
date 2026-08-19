import { db } from "@/db";
import { topics, assessments, subjects } from "@/db/schema";
import { asc, desc, eq, and, isNull } from "drizzle-orm";
import {
  calculateTopicProgress,
  calculateMasteryAverage,
  calculateMasteryDistribution,
  calculateEstimatedRemainingStudyHours,
  buildTopicTree,
  compareTopicsNatural,
} from "@/domain/topics";

import { getNotesCountsBySubjectId } from "./topic-note.service";
import { getBookmarksCountsBySubjectId } from "./material-bookmark.service";
import { getAnnotationsCountsBySubjectId } from "./pdf-annotation.service";

export async function getTopicsBySubjectId(subjectId: string) {
  const topicList = await db
    .select({
      id: topics.id,
      subjectId: topics.subjectId,
      parentId: topics.parentId,
      title: topics.title,
      description: topics.description,
      orderIndex: topics.orderIndex,
      masteryLevel: topics.masteryLevel,
      importance: topics.importance,
      estimatedHours: topics.estimatedHours,
      status: topics.status,
      assessmentId: topics.assessmentId,
      completedAt: topics.completedAt,
      createdAt: topics.createdAt,
      updatedAt: topics.updatedAt,
      assessmentTitle: assessments.title,
    })
    .from(topics)
    .leftJoin(assessments, eq(topics.assessmentId, assessments.id))
    .where(eq(topics.subjectId, subjectId))
    .orderBy(asc(topics.orderIndex), asc(topics.createdAt));

  const [notesCountMap, bookmarksCountMap, annotationsCountMap] = await Promise.all([
    getNotesCountsBySubjectId(subjectId).catch((): Record<string, number> => ({})),
    getBookmarksCountsBySubjectId(subjectId).catch((): Record<string, number> => ({})),
    getAnnotationsCountsBySubjectId(subjectId).catch((): Record<string, number> => ({})),
  ]);

  return topicList.map((t) => ({
    ...t,
    notesCount: notesCountMap[t.id] || 0,
    bookmarksCount: bookmarksCountMap[t.id] || 0,
    annotationsCount: annotationsCountMap[t.id] || 0,
  }));
}

export async function getSubjectTopicsSummary(subjectId: string) {
  const topicList = await getTopicsBySubjectId(subjectId);

  const progress = calculateTopicProgress(topicList);
  const mastery = calculateMasteryAverage(topicList);
  const distribution = calculateMasteryDistribution(topicList);
  const remainingHours = calculateEstimatedRemainingStudyHours(topicList);
  const tree = buildTopicTree(topicList);

  return {
    topics: topicList,
    tree,
    progress,
    mastery,
    distribution,
    remainingHours,
  };
}

export async function createTopic(data: {
  subjectId: string;
  parentId?: string | null;
  title: string;
  description?: string | null;
  orderIndex?: number;
  masteryLevel?: number;
  importance?: number;
  estimatedHours?: number | null;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "REVIEWED" | "COMPLETED" | "ARCHIVED";
  assessmentId?: string | null;
}) {
  if (data.parentId) {
    const [parent] = await db
      .select({ id: topics.id })
      .from(topics)
      .where(and(eq(topics.id, data.parentId), eq(topics.subjectId, data.subjectId)));

    if (!parent) {
      throw new Error("O tópico pai selecionado não pertence a esta disciplina.");
    }
  }

  let orderIndex = data.orderIndex;

  if (orderIndex === undefined || orderIndex === 0) {
    // Query sibling topics to calculate natural insertion order
    const siblings = await db
      .select({ id: topics.id, title: topics.title, orderIndex: topics.orderIndex })
      .from(topics)
      .where(
        data.parentId
          ? and(eq(topics.subjectId, data.subjectId), eq(topics.parentId, data.parentId))
          : and(eq(topics.subjectId, data.subjectId), isNull(topics.parentId))
      );

    if (siblings.length === 0) {
      orderIndex = 1;
    } else {
      // Natural sort comparing titles
      const allSiblings = [
        ...siblings,
        { id: "temp-new-item", title: data.title.trim(), orderIndex: 999999 },
      ].sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: "base" })
      );

      const targetPos = allSiblings.findIndex((s) => s.id === "temp-new-item");
      orderIndex = targetPos + 1;

      // Re-index siblings to maintain clean sequential order without collisions
      for (let i = 0; i < allSiblings.length; i++) {
        const item = allSiblings[i];
        if (item.id !== "temp-new-item" && item.orderIndex !== i + 1) {
          await db
            .update(topics)
            .set({ orderIndex: i + 1, updatedAt: new Date() })
            .where(eq(topics.id, item.id));
        }
      }
    }
  }

  const isCompleted = data.status === "COMPLETED" || data.masteryLevel === 4;

  const [newTopic] = await db
    .insert(topics)
    .values({
      subjectId: data.subjectId,
      parentId: data.parentId || null,
      title: data.title.trim(),
      description: data.description || null,
      orderIndex,
      masteryLevel: data.masteryLevel ?? 0,
      importance: data.importance ?? 3,
      estimatedHours: data.estimatedHours ?? null,
      status: data.status || (data.masteryLevel && data.masteryLevel > 0 ? "IN_PROGRESS" : "NOT_STARTED"),
      assessmentId: data.assessmentId || null,
      completedAt: isCompleted ? new Date() : null,
      updatedAt: new Date(),
    })
    .returning();

  return newTopic;
}

export async function batchCreateTopics(
  subjectId: string,
  rawText: string,
  assessmentId?: string | null,
  parentId?: string | null
) {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { count: 0 };

  const existing = await db
    .select({ orderIndex: topics.orderIndex })
    .from(topics)
    .where(eq(topics.subjectId, subjectId))
    .orderBy(desc(topics.orderIndex))
    .limit(1);

  let startIndex = existing.length > 0 ? existing[0].orderIndex + 1 : 1;

  const inserted = [];
  for (const line of lines) {
    const [t] = await db
      .insert(topics)
      .values({
        subjectId,
        parentId: parentId || null,
        title: line,
        orderIndex: startIndex++,
        masteryLevel: 0,
        importance: 3,
        status: "NOT_STARTED",
        assessmentId: assessmentId || null,
        updatedAt: new Date(),
      })
      .returning();

    inserted.push(t);
  }

  return { count: inserted.length, topics: inserted };
}

export async function updateTopic(
  id: string,
  data: Partial<{
    parentId: string | null;
    title: string;
    description: string | null;
    orderIndex: number;
    masteryLevel: number;
    importance: number;
    estimatedHours: number | null;
    status: "NOT_STARTED" | "IN_PROGRESS" | "REVIEWED" | "COMPLETED" | "ARCHIVED";
    assessmentId: string | null;
  }>
) {
  const [updated] = await db
    .update(topics)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(topics.id, id))
    .returning();

  return updated;
}

export async function updateTopicMastery(id: string, masteryLevel: number) {
  const clamped = Math.max(0, Math.min(4, masteryLevel));

  let status: "NOT_STARTED" | "IN_PROGRESS" | "REVIEWED" | "COMPLETED" = "IN_PROGRESS";
  let completedAt: Date | null = null;

  if (clamped === 4) {
    status = "COMPLETED";
    completedAt = new Date();
  } else if (clamped === 0) {
    status = "NOT_STARTED";
  }

  const [updated] = await db
    .update(topics)
    .set({
      masteryLevel: clamped,
      status,
      completedAt,
      updatedAt: new Date(),
    })
    .where(eq(topics.id, id))
    .returning();

  return updated;
}

export async function reorderTopics(
  subjectId: string,
  items: Array<{ id: string; orderIndex: number }>
) {
  for (const item of items) {
    await db
      .update(topics)
      .set({
        orderIndex: item.orderIndex,
        updatedAt: new Date(),
      })
      .where(and(eq(topics.id, item.id), eq(topics.subjectId, subjectId)));
  }

  return { success: true };
}

export async function deleteTopic(id: string) {
  const [deleted] = await db
    .delete(topics)
    .where(eq(topics.id, id))
    .returning();

  return deleted;
}
