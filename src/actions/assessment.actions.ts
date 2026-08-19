"use server";

import { revalidatePath } from "next/cache";
import {
  createAssessmentSchema,
  updateAssessmentSchema,
  saveGradeSchema,
} from "@/validations";
import * as assessmentService from "@/services/assessment.service";

export async function createAssessmentAction(formData: unknown) {
  try {
    const validated = createAssessmentSchema.parse(formData);
    const assessment = await assessmentService.createAssessment(validated);
    revalidatePath(`/subjects/${validated.subjectId}`);
    revalidatePath("/assessments");
    revalidatePath("/");
    return { success: true, data: assessment };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao cadastrar avaliação." };
  }
}

export async function updateAssessmentAction(
  id: string,
  subjectId: string,
  formData: unknown
) {
  try {
    const validated = updateAssessmentSchema.parse(formData);
    const updated = await assessmentService.updateAssessment(id, validated);
    revalidatePath(`/subjects/${subjectId}`);
    revalidatePath("/assessments");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao atualizar avaliação." };
  }
}

export async function deleteAssessmentAction(id: string, subjectId: string) {
  try {
    const deleted = await assessmentService.deleteAssessment(id);
    revalidatePath(`/subjects/${subjectId}`);
    revalidatePath("/assessments");
    revalidatePath("/");
    return { success: true, data: deleted };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao remover avaliação." };
  }
}

export async function saveGradeAction(formData: unknown, subjectId?: string) {
  try {
    const validated = saveGradeSchema.parse(formData);
    const result = await assessmentService.saveAssessmentResult(
      validated.assessmentId,
      validated.grade,
      validated.feedback
    );
    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    revalidatePath("/assessments");
    revalidatePath("/performance");
    revalidatePath("/");
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao registrar nota." };
  }
}

export async function deleteGradeAction(assessmentId: string, subjectId?: string) {
  try {
    const deleted = await assessmentService.deleteAssessmentResult(assessmentId);
    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    revalidatePath("/assessments");
    revalidatePath("/");
    return { success: true, data: deleted };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao remover nota." };
  }
}
