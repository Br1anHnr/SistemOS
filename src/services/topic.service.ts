import { db } from "@/db";
import { topics, assessments, subjects } from "@/db/schema";
import { asc, desc, eq, inArray } from "drizzle-orm";
import {
  calculateTopicProgress,
  calculateMasteryAverage,
  calculateMasteryDistribution,
  calculateEstimatedRemainingStudyHours,
  buildTopicTree,
} from "@/domain/topics";

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

  return topicList;
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
  let orderIndex = data.orderIndex;

  if (orderIndex === undefined || orderIndex === 0) {
    const existing = await db
      .select({ orderIndex: topics.orderIndex })
      .from(topics)
      .where(eq(topics.subjectId, data.subjectId))
      .orderBy(desc(topics.orderIndex))
      .limit(1);

    orderIndex = existing.length > 0 ? existing[0].orderIndex + 1 : 1;
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

  let startOrder = existing.length > 0 ? existing[0].orderIndex + 1 : 1;

  const topicsToInsert = lines.map((line, index) => {
    // Strip leading numbers/bullets like "1. ", "- ", "1) "
    const cleanedTitle = line.replace(/^(\d+[\.\)]|\-|\*)\s+/, "");

    return {
      subjectId,
      parentId: parentId || null,
      title: cleanedTitle,
      orderIndex: startOrder + index,
      masteryLevel: 0,
      importance: 3,
      status: "NOT_STARTED" as const,
      assessmentId: assessmentId || null,
      updatedAt: new Date(),
    };
  });

  await db.insert(topics).values(topicsToInsert);

  return { count: topicsToInsert.length };
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
  const isCompleted =
    data.status === "COMPLETED" || (data.masteryLevel !== undefined && data.masteryLevel === 4);

  const [updated] = await db
    .update(topics)
    .set({
      ...data,
      completedAt: isCompleted ? new Date() : data.status === "NOT_STARTED" ? null : undefined,
      updatedAt: new Date(),
    })
    .where(eq(topics.id, id))
    .returning();

  return updated;
}

export async function updateTopicMastery(id: string, masteryLevel: number) {
  const clamped = Math.max(0, Math.min(4, masteryLevel));

  let status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" = "IN_PROGRESS";
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
      .where(eq(topics.id, item.id));
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
