import { db } from "@/db";
import { studyBoards, studyBoardItems } from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

export interface StudyBoardItemData {
  id: string;
  boardId: string;
  type: "TEXT" | "NOTE" | "DRAWING" | "ARROW" | "PDF_REGION";
  data: Record<string, any>;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface StudyBoardData {
  id: string;
  topicId: string;
  name: string;
  items: StudyBoardItemData[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export async function getOrCreateBoardByTopicId(topicId: string): Promise<StudyBoardData> {
  let [board] = await db
    .select()
    .from(studyBoards)
    .where(eq(studyBoards.topicId, topicId));

  if (!board) {
    [board] = await db
      .insert(studyBoards)
      .values({
        topicId,
        name: "Lousa Principal",
        updatedAt: new Date(),
      })
      .returning();
  }

  const items = await db
    .select()
    .from(studyBoardItems)
    .where(eq(studyBoardItems.boardId, board.id))
    .orderBy(asc(studyBoardItems.zIndex), asc(studyBoardItems.createdAt));

  return {
    ...board,
    items: items as StudyBoardItemData[],
  };
}

export async function getBoardItems(boardId: string): Promise<StudyBoardItemData[]> {
  const items = await db
    .select()
    .from(studyBoardItems)
    .where(eq(studyBoardItems.boardId, boardId))
    .orderBy(asc(studyBoardItems.zIndex), asc(studyBoardItems.createdAt));

  return items as StudyBoardItemData[];
}

export async function createBoardItem(data: {
  boardId: string;
  type: "TEXT" | "NOTE" | "DRAWING" | "ARROW" | "PDF_REGION";
  data: Record<string, any>;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex?: number;
}): Promise<StudyBoardItemData> {
  const [created] = await db
    .insert(studyBoardItems)
    .values({
      boardId: data.boardId,
      type: data.type,
      data: data.data,
      x: data.x ?? 0,
      y: data.y ?? 0,
      width: data.width ?? 200,
      height: data.height ?? 150,
      zIndex: data.zIndex ?? 0,
      updatedAt: new Date(),
    })
    .returning();

  return created as StudyBoardItemData;
}

export async function updateBoardItem(
  id: string,
  data: Partial<{
    data: Record<string, any>;
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
  }>
): Promise<StudyBoardItemData | undefined> {
  const [updated] = await db
    .update(studyBoardItems)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(studyBoardItems.id, id))
    .returning();

  return updated as StudyBoardItemData | undefined;
}

export async function deleteBoardItem(id: string): Promise<StudyBoardItemData | undefined> {
  const [deleted] = await db
    .delete(studyBoardItems)
    .where(eq(studyBoardItems.id, id))
    .returning();

  return deleted as StudyBoardItemData | undefined;
}

export async function addPdfRegionToTopicBoard(data: {
  topicId: string;
  materialId?: string | null;
  pageNumber: number;
  anchorId?: string | null;
  bounding: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  title?: string | null;
}): Promise<StudyBoardItemData> {
  const board = await getOrCreateBoardByTopicId(data.topicId);

  // Position nicely in view
  const x = 120 + Math.floor(Math.random() * 100);
  const y = 120 + Math.floor(Math.random() * 100);

  const created = await createBoardItem({
    boardId: board.id,
    type: "PDF_REGION",
    x,
    y,
    width: 320,
    height: 220,
    zIndex: board.items.length + 1,
    data: {
      materialId: data.materialId || null,
      pageNumber: data.pageNumber,
      anchorId: data.anchorId || null,
      bounding: data.bounding,
      title: data.title || `Trecho da Pág. ${data.pageNumber}`,
    },
  });

  return created;
}
