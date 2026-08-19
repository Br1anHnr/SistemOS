"use server";

import { revalidatePath } from "next/cache";
import { updateGradingSchemeWithComponentsSchema } from "@/validations";
import * as gradingService from "@/services/grading.service";

export async function updateGradingSchemeAction(
  subjectId: string,
  formData: unknown
) {
  try {
    const validated = updateGradingSchemeWithComponentsSchema.parse(formData);
    const updated = await gradingService.updateGradingSchemeAndComponents(
      validated.schemeId,
      {
        passingGrade: validated.passingGrade,
        examEnabled: validated.examEnabled,
        examTriggerThreshold: validated.examTriggerThreshold,
        decimalPlaces: validated.decimalPlaces,
      },
      validated.components
    );
    revalidatePath(`/subjects/${subjectId}`);
    revalidatePath("/subjects");
    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao atualizar esquema de avaliação." };
  }
}
