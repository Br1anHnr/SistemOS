import { db } from "@/db";
import { pdfNoteAnchors, topicNotes, topics } from "@/db/schema";
import { asc, desc, eq, and } from "drizzle-orm";

export interface PdfNoteAnchorItem {
  id: string;
  noteId: string;
  topicId: string;
  materialId?: string | null;
  pageNumber: number;
  anchorType: "POINT" | "REGION";
  data: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AnchoredTopicNoteItem {
  id: string;
  topicId: string;
  materialId?: string | null;
  type: "NOTE" | "IMPORTANT" | "QUESTION" | "FORMULA" | "EXAM";
  content: string;
  pageNumber?: number | null;
  anchor?: PdfNoteAnchorItem | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export async function getAnchorsByTopicAndPage(
  topicId: string,
  pageNumber: number
): Promise<PdfNoteAnchorItem[]> {
  const list = await db
    .select()
    .from(pdfNoteAnchors)
    .where(
      and(
        eq(pdfNoteAnchors.topicId, topicId),
        eq(pdfNoteAnchors.pageNumber, pageNumber)
      )
    )
    .orderBy(asc(pdfNoteAnchors.createdAt));

  return list as PdfNoteAnchorItem[];
}

export async function getAnchoredNotesByTopicId(
  topicId: string
): Promise<AnchoredTopicNoteItem[]> {
  const notes = await db
    .select({
      id: topicNotes.id,
      topicId: topicNotes.topicId,
      materialId: topicNotes.materialId,
      type: topicNotes.type,
      content: topicNotes.content,
      pageNumber: topicNotes.pageNumber,
      createdAt: topicNotes.createdAt,
      updatedAt: topicNotes.updatedAt,
      anchorId: pdfNoteAnchors.id,
      anchorType: pdfNoteAnchors.anchorType,
      anchorData: pdfNoteAnchors.data,
      anchorPageNumber: pdfNoteAnchors.pageNumber,
      anchorCreatedAt: pdfNoteAnchors.createdAt,
      anchorUpdatedAt: pdfNoteAnchors.updatedAt,
    })
    .from(topicNotes)
    .leftJoin(pdfNoteAnchors, eq(topicNotes.id, pdfNoteAnchors.noteId))
    .where(eq(topicNotes.topicId, topicId))
    .orderBy(desc(topicNotes.createdAt));

  return notes.map((row) => ({
    id: row.id,
    topicId: row.topicId,
    materialId: row.materialId,
    type: row.type as any,
    content: row.content,
    pageNumber: row.pageNumber,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    anchor: row.anchorId
      ? {
          id: row.anchorId,
          noteId: row.id,
          topicId: row.topicId,
          materialId: row.materialId,
          pageNumber: row.anchorPageNumber!,
          anchorType: row.anchorType! as any,
          data: row.anchorData as any,
          createdAt: row.anchorCreatedAt!,
          updatedAt: row.anchorUpdatedAt!,
        }
      : null,
  }));
}

export async function createAnchoredNote(data: {
  topicId: string;
  materialId?: string | null;
  pageNumber: number;
  type?: "NOTE" | "IMPORTANT" | "QUESTION" | "FORMULA" | "EXAM";
  content: string;
  anchorType?: "POINT" | "REGION";
  anchorData: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
}) {
  // 1. Create the note
  const [createdNote] = await db
    .insert(topicNotes)
    .values({
      topicId: data.topicId,
      materialId: data.materialId || null,
      type: data.type || "NOTE",
      content: data.content.trim(),
      pageNumber: data.pageNumber,
      updatedAt: new Date(),
    })
    .returning();

  // 2. Create the anchor linked to noteId
  const [createdAnchor] = await db
    .insert(pdfNoteAnchors)
    .values({
      noteId: createdNote.id,
      topicId: data.topicId,
      materialId: data.materialId || null,
      pageNumber: data.pageNumber,
      anchorType: data.anchorType || "POINT",
      data: data.anchorData,
      updatedAt: new Date(),
    })
    .returning();

  return {
    ...createdNote,
    anchor: createdAnchor,
  };
}

export async function deletePdfNoteAnchor(id: string) {
  const [deleted] = await db
    .delete(pdfNoteAnchors)
    .where(eq(pdfNoteAnchors.id, id))
    .returning();

  return deleted;
}
