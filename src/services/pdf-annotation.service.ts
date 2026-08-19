import { db } from "@/db";
import { pdfAnnotations, topics } from "@/db/schema";
import { asc, desc, eq, and, sql } from "drizzle-orm";

export interface PdfAnnotationItem {
  id: string;
  topicId: string;
  materialId?: string | null;
  pageNumber: number;
  type: "PEN" | "HIGHLIGHT" | "ARROW" | "TEXT" | "RECTANGLE";
  data: Record<string, any>;
  schemaVersion: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export async function getAnnotationsByTopicAndPage(
  topicId: string,
  pageNumber: number
): Promise<PdfAnnotationItem[]> {
  const list = await db
    .select()
    .from(pdfAnnotations)
    .where(
      and(
        eq(pdfAnnotations.topicId, topicId),
        eq(pdfAnnotations.pageNumber, pageNumber)
      )
    )
    .orderBy(asc(pdfAnnotations.createdAt));

  return list as PdfAnnotationItem[];
}

export async function getAnnotationsCountsBySubjectId(
  subjectId: string
): Promise<Record<string, number>> {
  const rows = await db
    .select({
      topicId: pdfAnnotations.topicId,
      count: sql<number>`cast(count(${pdfAnnotations.id}) as int)`,
    })
    .from(pdfAnnotations)
    .innerJoin(topics, eq(pdfAnnotations.topicId, topics.id))
    .where(eq(topics.subjectId, subjectId))
    .groupBy(pdfAnnotations.topicId);

  const countMap: Record<string, number> = {};
  for (const row of rows) {
    countMap[row.topicId] = row.count;
  }
  return countMap;
}

export async function createPdfAnnotation(data: {
  topicId: string;
  materialId?: string | null;
  pageNumber: number;
  type: "PEN" | "HIGHLIGHT" | "ARROW" | "TEXT" | "RECTANGLE";
  data: Record<string, any>;
  schemaVersion?: number;
}): Promise<PdfAnnotationItem> {
  const [created] = await db
    .insert(pdfAnnotations)
    .values({
      topicId: data.topicId,
      materialId: data.materialId || null,
      pageNumber: data.pageNumber,
      type: data.type,
      data: data.data,
      schemaVersion: data.schemaVersion || 1,
      updatedAt: new Date(),
    })
    .returning();

  return created as PdfAnnotationItem;
}

export async function updatePdfAnnotation(
  id: string,
  data: Partial<{
    data: Record<string, any>;
    type: "PEN" | "HIGHLIGHT" | "ARROW" | "TEXT" | "RECTANGLE";
  }>
): Promise<PdfAnnotationItem | undefined> {
  const [updated] = await db
    .update(pdfAnnotations)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(pdfAnnotations.id, id))
    .returning();

  return updated as PdfAnnotationItem | undefined;
}

export async function deletePdfAnnotation(id: string): Promise<PdfAnnotationItem | undefined> {
  const [deleted] = await db
    .delete(pdfAnnotations)
    .where(eq(pdfAnnotations.id, id))
    .returning();

  return deleted as PdfAnnotationItem | undefined;
}
