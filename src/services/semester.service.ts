import { db } from "@/db";
import { semesters } from "@/db/schema";
import { desc, eq, not } from "drizzle-orm";

export async function getActiveSemester() {
  const active = await db
    .select()
    .from(semesters)
    .where(eq(semesters.status, "ACTIVE"))
    .limit(1);

  return active[0] || null;
}

export async function getAllSemesters() {
  return await db
    .select()
    .from(semesters)
    .orderBy(desc(semesters.startDate), desc(semesters.createdAt));
}

export async function getSemesterById(id: string) {
  const result = await db
    .select()
    .from(semesters)
    .where(eq(semesters.id, id))
    .limit(1);

  return result[0] || null;
}

export async function createSemester(data: {
  name: string;
  academicYear: string;
  academicTerm: string;
  startDate: string;
  endDate: string;
  status?: "PLANNED" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
}) {
  const status = data.status || "PLANNED";

  // If new semester is ACTIVE, change previously ACTIVE semesters to COMPLETED/PLANNED
  if (status === "ACTIVE") {
    await db
      .update(semesters)
      .set({ status: "COMPLETED", updatedAt: new Date() })
      .where(eq(semesters.status, "ACTIVE"));
  }

  const [newSemester] = await db
    .insert(semesters)
    .values({
      name: data.name,
      academicYear: data.academicYear,
      academicTerm: data.academicTerm,
      startDate: data.startDate,
      endDate: data.endDate,
      status: status,
      updatedAt: new Date(),
    })
    .returning();

  return newSemester;
}

export async function updateSemester(
  id: string,
  data: Partial<{
    name: string;
    academicYear: string;
    academicTerm: string;
    startDate: string;
    endDate: string;
    status: "PLANNED" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  }>
) {
  if (data.status === "ACTIVE") {
    await db
      .update(semesters)
      .set({ status: "COMPLETED", updatedAt: new Date() })
      .where(eq(semesters.status, "ACTIVE"));
  }

  const [updated] = await db
    .update(semesters)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(semesters.id, id))
    .returning();

  return updated;
}

export async function setActiveSemester(id: string) {
  // Deactivate all others
  await db
    .update(semesters)
    .set({ status: "COMPLETED", updatedAt: new Date() })
    .where(not(eq(semesters.id, id)));

  const [activated] = await db
    .update(semesters)
    .set({ status: "ACTIVE", updatedAt: new Date() })
    .where(eq(semesters.id, id))
    .returning();

  return activated;
}

export async function deleteSemester(id: string) {
  const [deleted] = await db
    .delete(semesters)
    .where(eq(semesters.id, id))
    .returning();

  return deleted;
}
