"use server";

import * as anchorService from "@/services/pdf-note-anchor.service";
import {
  createAnchoredNoteSchema,
  createPdfNoteAnchorSchema,
} from "@/validations";
import { revalidatePath } from "next/cache";

export async function getAnchorsByTopicAndPageAction(topicId: string, pageNumber: number) {
  try {
    const anchors = await anchorService.getAnchorsByTopicAndPage(topicId, pageNumber);
    return { success: true, data: anchors };
  } catch (error) {
    return { success: false, error: "Erro ao buscar marcadores da página." };
  }
}

export async function getAnchoredNotesAction(topicId: string) {
  try {
    const notes = await anchorService.getAnchoredNotesByTopicId(topicId);
    return { success: true, data: notes };
  } catch (error) {
    return { success: false, error: "Erro ao buscar anotações ancoradas." };
  }
}

export async function createAnchoredNoteAction(
  formData: unknown,
  subjectId?: string
) {
  try {
    const validated = createAnchoredNoteSchema.parse(formData);
    const created = await anchorService.createAnchoredNote(validated as any);

    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    return { success: true, data: created };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao salvar anotação ancorada." };
  }
}

export async function deletePdfNoteAnchorAction(id: string, subjectId?: string) {
  try {
    const deleted = await anchorService.deletePdfNoteAnchor(id);

    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    return { success: true, data: deleted };
  } catch (error) {
    return { success: false, error: "Erro ao excluir âncora." };
  }
}
