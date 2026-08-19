"use server";

import { revalidatePath } from "next/cache";
import {
  createTopicSchema,
  updateTopicSchema,
  updateTopicMasterySchema,
  batchCreateTopicsSchema,
} from "@/validations";
import * as topicService from "@/services/topic.service";

export async function createTopicAction(formData: unknown) {
  try {
    const validated = createTopicSchema.parse(formData);
    const topic = await topicService.createTopic(validated);
    revalidatePath(`/subjects/${validated.subjectId}`);
    revalidatePath("/studies");
    revalidatePath("/");
    return { success: true, data: topic };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao cadastrar tópico." };
  }
}

export async function batchCreateTopicsAction(formData: unknown) {
  try {
    const validated = batchCreateTopicsSchema.parse(formData);
    const result = await topicService.batchCreateTopics(
      validated.subjectId,
      validated.rawText,
      validated.assessmentId,
      validated.parentId
    );
    revalidatePath(`/subjects/${validated.subjectId}`);
    revalidatePath("/studies");
    revalidatePath("/");
    return { success: true, count: result.count };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao importar tópicos." };
  }
}

export async function updateTopicAction(
  id: string,
  subjectId: string,
  formData: unknown
) {
  try {
    const validated = updateTopicSchema.parse(formData);
    const updated = await topicService.updateTopic(id, validated);
    revalidatePath(`/subjects/${subjectId}`);
    revalidatePath("/studies");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao atualizar tópico." };
  }
}

export async function updateTopicMasteryAction(
  id: string,
  subjectId: string,
  masteryLevel: number
) {
  try {
    const validated = updateTopicMasterySchema.parse({
      topicId: id,
      masteryLevel,
    });
    const updated = await topicService.updateTopicMastery(
      validated.topicId,
      validated.masteryLevel
    );
    revalidatePath(`/subjects/${subjectId}`);
    revalidatePath("/studies");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao atualizar nível de domínio." };
  }
}

export async function toggleTopicCompleteAction(
  id: string,
  subjectId: string,
  isCompleted: boolean
) {
  try {
    const updated = await topicService.updateTopic(id, {
      status: isCompleted ? "COMPLETED" : "NOT_STARTED",
      masteryLevel: isCompleted ? 4 : 0,
    });
    revalidatePath(`/subjects/${subjectId}`);
    revalidatePath("/studies");
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao alterar conclusão do tópico." };
  }
}

export async function reorderTopicsAction(
  subjectId: string,
  items: Array<{ id: string; orderIndex: number }>
) {
  try {
    const res = await topicService.reorderTopics(subjectId, items);
    revalidatePath(`/subjects/${subjectId}`);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao reordenar tópicos." };
  }
}

export async function deleteTopicAction(id: string, subjectId: string) {
  try {
    const deleted = await topicService.deleteTopic(id);
    revalidatePath(`/subjects/${subjectId}`);
    revalidatePath("/studies");
    revalidatePath("/");
    return { success: true, data: deleted };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao remover tópico." };
  }
}
