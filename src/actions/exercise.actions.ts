"use server";

import { revalidatePath } from "next/cache";
import {
  getExerciseSetsBySubjectId,
  getExerciseSetById,
  createExerciseSet,
  updateExerciseSet,
  deleteExerciseSet,
  getExercisesBySubjectId,
  getExercisesByTopicId,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
  toggleExerciseNeedsReview,
  createExerciseAttempt,
  deleteExerciseAttempt,
  deleteExerciseAttachment,
  deleteAttemptAttachment,
  addExerciseSourceRegion,
  deleteExerciseSourceRegion,
  getExerciseSourceRegions,
} from "@/services/exercise.service";
import {
  createExerciseSetSchema,
  updateExerciseSetSchema,
  createExerciseSchema,
  updateExerciseSchema,
  createExerciseAttemptSchema,
  createExerciseSourceRegionSchema,
} from "@/validations";
import { z } from "zod";

export async function getExerciseSetsAction(subjectId: string) {
  try {
    const data = await getExerciseSetsBySubjectId(subjectId);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao listar listas de exercícios." };
  }
}

export async function getExerciseSetByIdAction(id: string, subjectId: string) {
  try {
    const data = await getExerciseSetById(id, subjectId);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao buscar lista de exercícios." };
  }
}

export async function createExerciseSetAction(rawData: z.input<typeof createExerciseSetSchema>) {
  try {
    const parsed = createExerciseSetSchema.parse(rawData);
    const created = await createExerciseSet(parsed);
    revalidatePath(`/subjects/${parsed.subjectId}`);
    return { success: true, data: created };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao criar lista de exercícios." };
  }
}

export async function updateExerciseSetAction(
  id: string,
  subjectId: string,
  rawData: z.input<typeof updateExerciseSetSchema>
) {
  try {
    const parsed = updateExerciseSetSchema.parse(rawData);
    const updated = await updateExerciseSet(id, subjectId, parsed);
    revalidatePath(`/subjects/${subjectId}`);
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao atualizar lista de exercícios." };
  }
}

export async function deleteExerciseSetAction(id: string, subjectId: string) {
  try {
    const deleted = await deleteExerciseSet(id, subjectId);
    revalidatePath(`/subjects/${subjectId}`);
    return { success: true, data: deleted };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao excluir lista de exercícios." };
  }
}

export async function getExercisesAction(
  subjectId: string,
  filters?: { topicId?: string; exerciseSetId?: string; standaloneOnly?: boolean }
) {
  try {
    const data = await getExercisesBySubjectId(subjectId, filters);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao buscar exercícios." };
  }
}

export async function getExercisesByTopicIdAction(topicId: string, subjectId: string) {
  try {
    const data = await getExercisesByTopicId(topicId, subjectId);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao buscar exercícios do tópico." };
  }
}

export async function getExerciseByIdAction(id: string, subjectId: string) {
  try {
    const data = await getExerciseById(id, subjectId);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao buscar detalhes do exercício." };
  }
}

export async function createExerciseAction(rawData: z.input<typeof createExerciseSchema>) {
  try {
    const parsed = createExerciseSchema.parse(rawData);
    const created = await createExercise(parsed);
    revalidatePath(`/subjects/${parsed.subjectId}`);
    return { success: true, data: created };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao criar exercício." };
  }
}

export async function updateExerciseAction(
  id: string,
  subjectId: string,
  rawData: z.input<typeof updateExerciseSchema>
) {
  try {
    const parsed = updateExerciseSchema.parse(rawData);
    const updated = await updateExercise(id, subjectId, parsed);
    revalidatePath(`/subjects/${subjectId}`);
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao atualizar exercício." };
  }
}

export async function deleteExerciseAction(id: string, subjectId: string) {
  try {
    const deleted = await deleteExercise(id, subjectId);
    revalidatePath(`/subjects/${subjectId}`);
    return { success: true, data: deleted };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao excluir exercício." };
  }
}

export async function toggleExerciseNeedsReviewAction(
  id: string,
  subjectId: string,
  needsReview: boolean
) {
  try {
    const updated = await toggleExerciseNeedsReview(id, subjectId, needsReview);
    revalidatePath(`/subjects/${subjectId}`);
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao atualizar status de revisão." };
  }
}

export async function createExerciseAttemptAction(
  rawData: z.input<typeof createExerciseAttemptSchema>,
  subjectId?: string
) {
  try {
    const parsed = createExerciseAttemptSchema.parse(rawData);
    const attempt = await createExerciseAttempt(parsed, subjectId);
    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    return { success: true, data: attempt };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao registrar tentativa." };
  }
}

export async function deleteExerciseAttemptAction(attemptId: string, subjectId?: string) {
  try {
    const deleted = await deleteExerciseAttempt(attemptId);
    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    return { success: true, data: deleted };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao excluir tentativa." };
  }
}

export async function deleteExerciseAttachmentAction(attachmentId: string, subjectId?: string) {
  try {
    const deleted = await deleteExerciseAttachment(attachmentId);
    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    return { success: true, data: deleted };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao excluir anexo do enunciado." };
  }
}

export async function deleteAttemptAttachmentAction(attachmentId: string, subjectId?: string) {
  try {
    const deleted = await deleteAttemptAttachment(attachmentId);
    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    return { success: true, data: deleted };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao excluir foto da resolução." };
  }
}

export async function addExerciseSourceRegionAction(
  rawData: z.input<typeof createExerciseSourceRegionSchema>,
  subjectId?: string
) {
  try {
    const parsed = createExerciseSourceRegionSchema.parse(rawData);
    const created = await addExerciseSourceRegion(parsed);
    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    return { success: true, data: created };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao adicionar trecho da questão." };
  }
}

export async function deleteExerciseSourceRegionAction(
  regionId: string,
  subjectId: string
) {
  try {
    const deleted = await deleteExerciseSourceRegion(regionId, subjectId);
    revalidatePath(`/subjects/${subjectId}`);
    return { success: true, data: deleted };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao remover trecho da questão." };
  }
}

export async function getExerciseSourceRegionsAction(exerciseId: string) {
  try {
    const data = await getExerciseSourceRegions(exerciseId);
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erro ao carregar trechos da questão." };
  }
}

