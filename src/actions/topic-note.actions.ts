"use server";

import * as topicNoteService from "@/services/topic-note.service";
import {
  createTopicNoteSchema,
  updateTopicNoteSchema,
} from "@/validations";
import { revalidatePath } from "next/cache";

export async function getTopicNotesAction(topicId: string) {
  try {
    const notes = await topicNoteService.getNotesByTopicId(topicId);
    return { success: true, data: notes };
  } catch (error) {
    return { success: false, error: "Erro ao buscar notas do tópico." };
  }
}

export async function createTopicNoteAction(
  formData: unknown,
  subjectId?: string
) {
  try {
    const validated = createTopicNoteSchema.parse(formData);
    const created = await topicNoteService.createTopicNote(validated);

    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    return { success: true, data: created };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao criar anotação." };
  }
}

export async function updateTopicNoteAction(
  id: string,
  formData: unknown,
  subjectId?: string
) {
  try {
    const validated = updateTopicNoteSchema.parse(formData);
    const updated = await topicNoteService.updateTopicNote(id, validated);

    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao atualizar anotação." };
  }
}

export async function deleteTopicNoteAction(id: string, subjectId?: string) {
  try {
    const deleted = await topicNoteService.deleteTopicNote(id);

    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    return { success: true, data: deleted };
  } catch (error) {
    return { success: false, error: "Erro ao excluir anotação." };
  }
}
