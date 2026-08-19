import { db } from "@/db";
import {
  subjects,
  semesters,
  subjectSchedules,
  gradingSchemes,
  gradeComponents,
} from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";

export async function getSubjectsBySemesterId(semesterId: string) {
  const subjectList = await db
    .select()
    .from(subjects)
    .where(eq(subjects.semesterId, semesterId))
    .orderBy(asc(subjects.name));

  // Attach schedules to each subject
  const subjectsWithSchedules = await Promise.all(
    subjectList.map(async (subject) => {
      const schedules = await db
        .select()
        .from(subjectSchedules)
        .where(eq(subjectSchedules.subjectId, subject.id))
        .orderBy(asc(subjectSchedules.dayOfWeek), asc(subjectSchedules.startTime));

      return {
        ...subject,
        schedules,
      };
    })
  );

  return subjectsWithSchedules;
}

export async function getSubjectById(id: string) {
  const [subject] = await db
    .select()
    .from(subjects)
    .where(eq(subjects.id, id))
    .limit(1);

  if (!subject) return null;

  const [semester] = await db
    .select()
    .from(semesters)
    .where(eq(semesters.id, subject.semesterId))
    .limit(1);

  const schedules = await db
    .select()
    .from(subjectSchedules)
    .where(eq(subjectSchedules.subjectId, subject.id))
    .orderBy(asc(subjectSchedules.dayOfWeek), asc(subjectSchedules.startTime));

  const [gradingScheme] = await db
    .select()
    .from(gradingSchemes)
    .where(eq(gradingSchemes.subjectId, subject.id))
    .limit(1);

  let components: (typeof gradeComponents.$inferSelect)[] = [];
  if (gradingScheme) {
    components = await db
      .select()
      .from(gradeComponents)
      .where(eq(gradeComponents.gradingSchemeId, gradingScheme.id))
      .orderBy(asc(gradeComponents.orderIndex), asc(gradeComponents.code));
  }

  return {
    ...subject,
    semester,
    schedules,
    gradingScheme: gradingScheme
      ? {
          ...gradingScheme,
          components,
        }
      : null,
  };
}

export async function createSubject(data: {
  semesterId: string;
  name: string;
  code?: string | null;
  professor?: string | null;
  room?: string | null;
  workloadHours?: number | null;
  minimumAttendancePercentage?: number;
  personalDifficulty?: number;
  color?: string | null;
  status?: "ACTIVE" | "COMPLETED" | "FAILED" | "DROPPED" | "ARCHIVED";
}) {
  const [newSubject] = await db
    .insert(subjects)
    .values({
      semesterId: data.semesterId,
      name: data.name,
      code: data.code || null,
      professor: data.professor || null,
      room: data.room || null,
      workloadHours: data.workloadHours || null,
      minimumAttendancePercentage: data.minimumAttendancePercentage ?? 75,
      personalDifficulty: data.personalDifficulty ?? 3,
      color: data.color || "#3b82f6",
      status: data.status || "ACTIVE",
      updatedAt: new Date(),
    })
    .returning();

  // Create default grading scheme
  const [scheme] = await db
    .insert(gradingSchemes)
    .values({
      subjectId: newSubject.id,
      passingGrade: 5,
      examEnabled: true,
      examTriggerThreshold: 5,
      decimalPlaces: 2,
      roundingMode: "ROUND_HALF_UP",
      updatedAt: new Date(),
    })
    .returning();

  // Create preset components: P1 (weight 1) and P2 (weight 1)
  await db.insert(gradeComponents).values([
    {
      gradingSchemeId: scheme.id,
      name: "Prova 1",
      code: "P1",
      weight: 1,
      maxGrade: 10,
      orderIndex: 1,
      isExam: false,
      updatedAt: new Date(),
    },
    {
      gradingSchemeId: scheme.id,
      name: "Prova 2",
      code: "P2",
      weight: 1,
      maxGrade: 10,
      orderIndex: 2,
      isExam: false,
      updatedAt: new Date(),
    },
  ]);

  return newSubject;
}

export async function updateSubject(
  id: string,
  data: Partial<{
    name: string;
    code: string | null;
    professor: string | null;
    room: string | null;
    workloadHours: number | null;
    minimumAttendancePercentage: number;
    personalDifficulty: number;
    color: string | null;
    status: "ACTIVE" | "COMPLETED" | "FAILED" | "DROPPED" | "ARCHIVED";
  }>
) {
  const [updated] = await db
    .update(subjects)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(subjects.id, id))
    .returning();

  return updated;
}

export async function deleteSubject(id: string) {
  const [deleted] = await db
    .delete(subjects)
    .where(eq(subjects.id, id))
    .returning();

  return deleted;
}
