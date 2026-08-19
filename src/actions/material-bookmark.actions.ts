"use server";

import * as bookmarkService from "@/services/material-bookmark.service";
import {
  createMaterialBookmarkSchema,
  updateMaterialBookmarkSchema,
} from "@/validations";
import { revalidatePath } from "next/cache";

export async function getTopicBookmarksAction(topicId: string) {
  try {
    const list = await bookmarkService.getBookmarksByTopicId(topicId);
    return { success: true, data: list };
  } catch (error) {
    return { success: false, error: "Erro ao buscar marcadores do tópico." };
  }
}

export async function createMaterialBookmarkAction(
  formData: unknown,
  subjectId?: string
) {
  try {
    const validated = createMaterialBookmarkSchema.parse(formData);
    const created = await bookmarkService.createMaterialBookmark(validated);

    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    return { success: true, data: created };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao criar marcador." };
  }
}

export async function updateMaterialBookmarkAction(
  id: string,
  formData: unknown,
  subjectId?: string
) {
  try {
    const validated = updateMaterialBookmarkSchema.parse(formData);
    const updated = await bookmarkService.updateMaterialBookmark(id, validated);

    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao atualizar marcador." };
  }
}

export async function deleteMaterialBookmarkAction(
  id: string,
  subjectId?: string
) {
  try {
    const deleted = await bookmarkService.deleteMaterialBookmark(id);

    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    return { success: true, data: deleted };
  } catch (error) {
    return { success: false, error: "Erro ao excluir marcador." };
  }
}
