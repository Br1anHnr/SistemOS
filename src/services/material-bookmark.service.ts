import { db } from "@/db";
import { materialBookmarks, topics } from "@/db/schema";
import { asc, desc, eq, and, sql } from "drizzle-orm";

export async function getBookmarksByTopicId(topicId: string) {
  const list = await db
    .select()
    .from(materialBookmarks)
    .where(eq(materialBookmarks.topicId, topicId))
    .orderBy(asc(materialBookmarks.pageNumber), desc(materialBookmarks.createdAt));

  return list;
}

export async function getBookmarksByMaterialId(materialId: string) {
  const list = await db
    .select()
    .from(materialBookmarks)
    .where(eq(materialBookmarks.materialId, materialId))
    .orderBy(asc(materialBookmarks.pageNumber), desc(materialBookmarks.createdAt));

  return list;
}

export async function getBookmarksCountsBySubjectId(subjectId: string) {
  const rows = await db
    .select({
      topicId: materialBookmarks.topicId,
      count: sql<number>`cast(count(${materialBookmarks.id}) as int)`,
    })
    .from(materialBookmarks)
    .innerJoin(topics, eq(materialBookmarks.topicId, topics.id))
    .where(eq(topics.subjectId, subjectId))
    .groupBy(materialBookmarks.topicId);

  const countMap: Record<string, number> = {};
  for (const row of rows) {
    countMap[row.topicId] = row.count;
  }
  return countMap;
}

export async function createMaterialBookmark(data: {
  topicId: string;
  materialId: string;
  pageNumber: number;
  title: string;
  type?: "BOOKMARK" | "IMPORTANT" | "EXAM" | "QUESTION";
}) {
  const [created] = await db
    .insert(materialBookmarks)
    .values({
      topicId: data.topicId,
      materialId: data.materialId,
      pageNumber: data.pageNumber,
      title: data.title.trim(),
      type: data.type || "BOOKMARK",
      updatedAt: new Date(),
    })
    .returning();

  return created;
}

export async function updateMaterialBookmark(
  id: string,
  data: Partial<{
    pageNumber: number;
    title: string;
    type: "BOOKMARK" | "IMPORTANT" | "EXAM" | "QUESTION";
  }>
) {
  const [updated] = await db
    .update(materialBookmarks)
    .set({
      ...data,
      title: data.title !== undefined ? data.title.trim() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(materialBookmarks.id, id))
    .returning();

  return updated;
}

export async function deleteMaterialBookmark(id: string) {
  const [deleted] = await db
    .delete(materialBookmarks)
    .where(eq(materialBookmarks.id, id))
    .returning();

  return deleted;
}
