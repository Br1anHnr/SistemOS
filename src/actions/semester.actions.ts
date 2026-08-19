"use server";

import { revalidatePath } from "next/cache";
import {
  createSemesterSchema,
  updateSemesterSchema,
} from "@/validations";
import * as semesterService from "@/services/semester.service";

export async function createSemesterAction(formData: unknown) {
  try {
    const validated = createSemesterSchema.parse(formData);
    const semester = await semesterService.createSemester(validated);
    revalidatePath("/semester");
    revalidatePath("/subjects");
    revalidatePath("/");
    return { success: true, data: semester };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao criar semestre." };
  }
}

export async function updateSemesterAction(id: string, formData: unknown) {
  try {
    const validated = updateSemesterSchema.parse(formData);
    const updated = await semesterService.updateSemester(id, validated);
    revalidatePath("/semester");
    revalidatePath("/subjects");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao atualizar semestre." };
  }
}

export async function setActiveSemesterAction(id: string) {
  try {
    const active = await semesterService.setActiveSemester(id);
    revalidatePath("/semester");
    revalidatePath("/subjects");
    revalidatePath("/");
    return { success: true, data: active };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao ativar semestre." };
  }
}

export async function deleteSemesterAction(id: string) {
  try {
    const deleted = await semesterService.deleteSemester(id);
    revalidatePath("/semester");
    revalidatePath("/subjects");
    revalidatePath("/");
    return { success: true, data: deleted };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao excluir semestre." };
  }
}
