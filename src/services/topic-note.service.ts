import { db } from "@/db";
import { topicNotes, topics } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";

export async function getNotesByTopicId(topicId: string) {
  const notes = await db
    .select()
    .from(topicNotes)
    .where(eq(topicNotes.topicId, topicId))
    .orderBy(desc(topicNotes.createdAt));

  return notes;
}

export async function getNotesCountsBySubjectId(subjectId: string) {
  const rows = await db
    .select({
      topicId: topicNotes.topicId,
      count: sql<number>`cast(count(${topicNotes.id}) as int)`,
    })
    .from(topicNotes)
    .innerJoin(topics, eq(topicNotes.topicId, topics.id))
    .where(eq(topics.subjectId, subjectId))
    .groupBy(topicNotes.topicId);

  const countMap: Record<string, number> = {};
  for (const row of rows) {
    countMap[row.topicId] = row.count;
  }
  return countMap;
}

export async function createTopicNote(data: {
  topicId: string;
  materialId?: string | null;
  type?: "NOTE" | "IMPORTANT" | "QUESTION" | "FORMULA" | "EXAM";
  content: string;
  pageNumber?: number | null;
}) {
  const [created] = await db
    .insert(topicNotes)
    .values({
      topicId: data.topicId,
      materialId: data.materialId || null,
      type: data.type || "NOTE",
      content: data.content.trim(),
      pageNumber: data.pageNumber ?? null,
      updatedAt: new Date(),
    })
    .returning();

  return created;
}

export async function updateTopicNote(
  id: string,
  data: Partial<{
    type: "NOTE" | "IMPORTANT" | "QUESTION" | "FORMULA" | "EXAM";
    content: string;
    pageNumber: number | null;
  }>
) {
  const [updated] = await db
    .update(topicNotes)
    .set({
      ...data,
      content: data.content !== undefined ? data.content.trim() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(topicNotes.id, id))
    .returning();

  return updated;
}

export async function deleteTopicNote(id: string) {
  const [deleted] = await db
    .delete(topicNotes)
    .where(eq(topicNotes.id, id))
    .returning();

  return deleted;
}
