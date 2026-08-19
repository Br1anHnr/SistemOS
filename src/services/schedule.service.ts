import { db } from "@/db";
import { subjectSchedules, subjects } from "@/db/schema";
import { asc, eq, inArray } from "drizzle-orm";

export async function getSchedulesBySubjectId(subjectId: string) {
  return await db
    .select()
    .from(subjectSchedules)
    .where(eq(subjectSchedules.subjectId, subjectId))
    .orderBy(asc(subjectSchedules.dayOfWeek), asc(subjectSchedules.startTime));
}

export async function createSchedule(data: {
  subjectId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
}) {
  const [created] = await db
    .insert(subjectSchedules)
    .values({
      subjectId: data.subjectId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      room: data.room || null,
      updatedAt: new Date(),
    })
    .returning();

  return created;
}

export async function updateSchedule(
  id: string,
  data: Partial<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room: string | null;
  }>
) {
  const [updated] = await db
    .update(subjectSchedules)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(subjectSchedules.id, id))
    .returning();

  return updated;
}

export async function deleteSchedule(id: string) {
  const [deleted] = await db
    .delete(subjectSchedules)
    .where(eq(subjectSchedules.id, id))
    .returning();

  return deleted;
}

export async function getWeeklySchedulesForSemester(semesterId: string) {
  const subjectList = await db
    .select({ id: subjects.id, name: subjects.name, color: subjects.color, code: subjects.code })
    .from(subjects)
    .where(eq(subjects.semesterId, semesterId));

  if (subjectList.length === 0) return [];

  const subjectIds = subjectList.map((s) => s.id);
  const subjectMap = new Map(subjectList.map((s) => [s.id, s]));

  const schedules = await db
    .select()
    .from(subjectSchedules)
    .where(inArray(subjectSchedules.subjectId, subjectIds))
    .orderBy(asc(subjectSchedules.dayOfWeek), asc(subjectSchedules.startTime));

  return schedules.map((sc) => ({
    ...sc,
    subject: subjectMap.get(sc.subjectId),
  }));
}

export async function getTodaySchedules(semesterId: string) {
  const allSchedules = await getWeeklySchedulesForSemester(semesterId);
  const todayDayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

  return allSchedules.filter((s) => s.dayOfWeek === todayDayOfWeek);
}
