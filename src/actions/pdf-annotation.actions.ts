"use server";

import * as annotationService from "@/services/pdf-annotation.service";
import {
  createPdfAnnotationSchema,
  updatePdfAnnotationSchema,
} from "@/validations";
import { revalidatePath } from "next/cache";

export async function getPdfAnnotationsAction(topicId: string, pageNumber: number) {
  try {
    const list = await annotationService.getAnnotationsByTopicAndPage(topicId, pageNumber);
    return { success: true, data: list };
  } catch (error) {
    return { success: false, error: "Erro ao buscar anotações da página." };
  }
}

export async function createPdfAnnotationAction(
  formData: unknown,
  subjectId?: string
) {
  try {
    const validated = createPdfAnnotationSchema.parse(formData);
    const created = await annotationService.createPdfAnnotation(validated as any);

    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    return { success: true, data: created };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao salvar anotação gráfica." };
  }
}

export async function updatePdfAnnotationAction(
  id: string,
  formData: unknown,
  subjectId?: string
) {
  try {
    const validated = updatePdfAnnotationSchema.parse(formData);
    const updated = await annotationService.updatePdfAnnotation(id, validated as any);

    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao atualizar anotação gráfica." };
  }
}

export async function deletePdfAnnotationAction(
  id: string,
  subjectId?: string
) {
  try {
    const deleted = await annotationService.deletePdfAnnotation(id);

    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    return { success: true, data: deleted };
  } catch (error) {
    return { success: false, error: "Erro ao excluir anotação gráfica." };
  }
}
