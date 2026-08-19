"use server";

import * as boardService from "@/services/study-board.service";
import {
  createStudyBoardItemSchema,
  updateStudyBoardItemSchema,
  addPdfRegionToBoardSchema,
} from "@/validations";
import { revalidatePath } from "next/cache";

export async function getTopicBoardAction(topicId: string) {
  try {
    const board = await boardService.getOrCreateBoardByTopicId(topicId);
    return { success: true, data: board };
  } catch (error) {
    return { success: false, error: "Erro ao carregar lousa do tópico." };
  }
}

export async function createStudyBoardItemAction(
  formData: unknown,
  subjectId?: string
) {
  try {
    const validated = createStudyBoardItemSchema.parse(formData);
    const created = await boardService.createBoardItem(validated as any);

    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    return { success: true, data: created };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao criar elemento na lousa." };
  }
}

export async function updateStudyBoardItemAction(
  id: string,
  formData: unknown,
  subjectId?: string
) {
  try {
    const validated = updateStudyBoardItemSchema.parse(formData);
    const updated = await boardService.updateBoardItem(id, validated as any);

    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao atualizar elemento na lousa." };
  }
}

export async function deleteStudyBoardItemAction(
  id: string,
  subjectId?: string
) {
  try {
    const deleted = await boardService.deleteBoardItem(id);

    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    return { success: true, data: deleted };
  } catch (error) {
    return { success: false, error: "Erro ao excluir elemento da lousa." };
  }
}

export async function addPdfRegionToBoardAction(
  formData: unknown,
  subjectId?: string
) {
  try {
    const validated = addPdfRegionToBoardSchema.parse(formData);
    const created = await boardService.addPdfRegionToTopicBoard(validated as any);

    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    return { success: true, data: created };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao adicionar trecho à lousa." };
  }
}
