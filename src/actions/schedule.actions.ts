"use server";

import { revalidatePath } from "next/cache";
import { createSubjectScheduleSchema } from "@/validations";
import * as scheduleService from "@/services/schedule.service";

export async function createScheduleAction(formData: unknown) {
  try {
    const validated = createSubjectScheduleSchema.parse(formData);
    const schedule = await scheduleService.createSchedule(validated);
    revalidatePath(`/subjects/${validated.subjectId}`);
    revalidatePath("/subjects");
    revalidatePath("/");
    return { success: true, data: schedule };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao adicionar horário." };
  }
}

export async function deleteScheduleAction(id: string, subjectId: string) {
  try {
    const deleted = await scheduleService.deleteSchedule(id);
    revalidatePath(`/subjects/${subjectId}`);
    revalidatePath("/subjects");
    revalidatePath("/");
    return { success: true, data: deleted };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao remover horário." };
  }
}
