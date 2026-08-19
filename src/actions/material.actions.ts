"use server";

import { revalidatePath } from "next/cache";
import { createMaterialSchema } from "@/validations";
import * as materialService from "@/services/material.service";

export async function createMaterialAction(formData: unknown) {
  try {
    const validated = createMaterialSchema.parse(formData);
    const material = await materialService.createMaterial(validated);
    revalidatePath(`/subjects/${validated.subjectId}`);
    return { success: true, data: material };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao salvar material." };
  }
}

export async function deleteMaterialAction(id: string, subjectId: string) {
  try {
    const deleted = await materialService.deleteMaterial(id);
    revalidatePath(`/subjects/${subjectId}`);
    return { success: true, data: deleted };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao remover material." };
  }
}
