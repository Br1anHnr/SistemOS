"use server";

import { revalidatePath } from "next/cache";
import { createSubjectSchema, updateSubjectSchema } from "@/validations";
import * as subjectService from "@/services/subject.service";

export async function createSubjectAction(formData: unknown) {
  try {
    const validated = createSubjectSchema.parse(formData);
    const subject = await subjectService.createSubject(validated);
    revalidatePath("/subjects");
    revalidatePath("/");
    return { success: true, data: subject };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao criar disciplina." };
  }
}

export async function updateSubjectAction(id: string, formData: unknown) {
  try {
    const validated = updateSubjectSchema.parse(formData);
    const updated = await subjectService.updateSubject(id, validated);
    revalidatePath("/subjects");
    revalidatePath(`/subjects/${id}`);
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao atualizar disciplina." };
  }
}

export async function deleteSubjectAction(id: string) {
  try {
    const deleted = await subjectService.deleteSubject(id);
    revalidatePath("/subjects");
    revalidatePath("/");
    return { success: true, data: deleted };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao excluir disciplina." };
  }
}
