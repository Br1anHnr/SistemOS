import { db } from "@/db";
import { subjectMaterials, topics } from "@/db/schema";
import { asc, desc, eq, and } from "drizzle-orm";

export async function getMaterialsBySubjectId(subjectId: string) {
  const list = await db
    .select()
    .from(subjectMaterials)
    .where(eq(subjectMaterials.subjectId, subjectId))
    .orderBy(desc(subjectMaterials.createdAt));

  return list;
}

export async function createMaterial(data: {
  subjectId: string;
  topicId?: string | null;
  title: string;
  fileName: string;
  fileType?: string;
  fileUrl: string;
  fileSize?: number | null;
  pageCount?: number | null;
}) {
  if (data.topicId) {
    const [topic] = await db
      .select({ id: topics.id })
      .from(topics)
      .where(and(eq(topics.id, data.topicId), eq(topics.subjectId, data.subjectId)));

    if (!topic) {
      throw new Error("O tópico vinculado ao material não pertence a esta disciplina.");
    }
  }

  const [created] = await db
    .insert(subjectMaterials)
    .values({
      subjectId: data.subjectId,
      topicId: data.topicId || null,
      title: data.title.trim(),
      fileName: data.fileName,
      fileType: data.fileType || "PDF",
      fileUrl: data.fileUrl,
      fileSize: data.fileSize ?? null,
      pageCount: data.pageCount ?? null,
      updatedAt: new Date(),
    })
    .returning();

  return created;
}

export async function deleteMaterial(id: string) {
  const [deleted] = await db
    .delete(subjectMaterials)
    .where(eq(subjectMaterials.id, id))
    .returning();

  return deleted;
}
