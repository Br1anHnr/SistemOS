"use server";

import { revalidatePath } from "next/cache";
import {
  recordAttendanceSchema,
  createClassSessionSchema,
} from "@/validations";
import * as attendanceService from "@/services/attendance.service";

export async function recordAttendanceAction(
  formData: unknown,
  subjectId?: string
) {
  try {
    const validated = recordAttendanceSchema.parse(formData);
    const result = await attendanceService.recordAttendance({
      classSessionId: validated.classSessionId,
      status: validated.status,
      absentUnits: validated.absentUnits,
      notes: validated.notes,
    });
    if (subjectId) {
      revalidatePath(`/subjects/${subjectId}`);
    }
    revalidatePath("/attendance");
    revalidatePath("/");
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao registrar presença/falta." };
  }
}

export async function createClassSessionAction(formData: unknown) {
  try {
    const validated = createClassSessionSchema.parse(formData);
    const session = await attendanceService.createClassSession(validated);
    revalidatePath(`/subjects/${validated.subjectId}`);
    revalidatePath("/attendance");
    revalidatePath("/");
    return { success: true, data: session };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao criar aula." };
  }
}

export async function updateClassSessionStatusAction(
  id: string,
  subjectId: string,
  status: "SCHEDULED" | "HELD" | "CANCELED"
) {
  try {
    const session = await attendanceService.updateClassSession(id, { status });
    revalidatePath(`/subjects/${subjectId}`);
    revalidatePath("/attendance");
    revalidatePath("/");
    return { success: true, data: session };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao alterar status da aula." };
  }
}

export async function deleteClassSessionAction(id: string, subjectId: string) {
  try {
    const deleted = await attendanceService.deleteClassSession(id);
    revalidatePath(`/subjects/${subjectId}`);
    revalidatePath("/attendance");
    revalidatePath("/");
    return { success: true, data: deleted };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao remover aula." };
  }
}

export async function generateClassSessionsAction(subjectId: string) {
  try {
    const result = await attendanceService.generateClassSessionsFromSchedule(subjectId);
    revalidatePath(`/subjects/${subjectId}`);
    revalidatePath("/attendance");
    revalidatePath("/");
    return { success: true, count: result.count };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Erro ao gerar grade de aulas." };
  }
}
