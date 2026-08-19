import { db } from "@/db";
import {
  classSessions,
  attendances,
  subjectSchedules,
  subjects,
  semesters,
} from "@/db/schema";
import { asc, desc, eq, inArray, and } from "drizzle-orm";
import {
  calculateAttendancePercentage,
  calculateMaximumAbsences,
  calculateRemainingAbsences,
  simulateAbsence,
  AttendanceInput,
} from "@/domain/attendance";

export async function getClassSessionsWithAttendanceBySubjectId(subjectId: string) {
  const sessions = await db
    .select()
    .from(classSessions)
    .where(eq(classSessions.subjectId, subjectId))
    .orderBy(desc(classSessions.date), desc(classSessions.startTime));

  if (sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);

  const attendanceRecords = await db
    .select()
    .from(attendances)
    .where(inArray(attendances.classSessionId, sessionIds));

  const attendanceMap = new Map(attendanceRecords.map((a) => [a.classSessionId, a]));

  return sessions.map((s) => ({
    ...s,
    attendance: attendanceMap.get(s.id) || null,
  }));
}

export async function getSubjectAttendanceSummary(subjectId: string) {
  const [subject] = await db
    .select()
    .from(subjects)
    .where(eq(subjects.id, subjectId))
    .limit(1);

  if (!subject) return null;

  const sessions = await getClassSessionsWithAttendanceBySubjectId(subjectId);

  // Map to AttendanceInput for pure domain functions
  const attendanceInputs: AttendanceInput[] = sessions.map((s) => ({
    session: {
      absenceUnits: s.absenceUnits,
      isCanceled: s.status === "CANCELED",
    },
    absentUnits: s.attendance ? s.attendance.absentUnits : 0,
  }));

  const activeSessions = sessions.filter((s) => s.status !== "CANCELED");
  const canceledSessions = sessions.filter((s) => s.status === "CANCELED");

  const totalUnits = activeSessions.reduce((sum, s) => sum + s.absenceUnits, 0);
  const totalAbsentUnits = sessions.reduce(
    (sum, s) => sum + (s.status !== "CANCELED" && s.attendance ? s.attendance.absentUnits : 0),
    0
  );

  const percentage = calculateAttendancePercentage(attendanceInputs);
  const maxAbsences = calculateMaximumAbsences(
    totalUnits,
    subject.minimumAttendancePercentage
  );
  const remainingAbsences = calculateRemainingAbsences(
    totalUnits,
    totalAbsentUnits,
    subject.minimumAttendancePercentage
  );

  const isAtRisk = totalAbsentUnits > maxAbsences;

  return {
    subject,
    sessions,
    totalSessionsCount: sessions.length,
    activeSessionsCount: activeSessions.length,
    canceledSessionsCount: canceledSessions.length,
    totalUnits,
    totalAbsentUnits,
    percentage,
    maxAbsences,
    remainingAbsences,
    isAtRisk,
  };
}

export async function getSemesterAttendanceSummary(semesterId: string) {
  const subjectList = await db
    .select()
    .from(subjects)
    .where(eq(subjects.semesterId, semesterId))
    .orderBy(asc(subjects.name));

  const summaries = await Promise.all(
    subjectList.map(async (subj) => {
      const summary = await getSubjectAttendanceSummary(subj.id);
      return {
        subject: subj,
        summary,
      };
    })
  );

  return summaries;
}

export async function recordAttendance(data: {
  classSessionId: string;
  status: "PRESENT" | "ABSENT" | "PARTIAL" | "EXCUSED" | "NOT_RECORDED";
  absentUnits: number;
  notes?: string | null;
}) {
  const existing = await db
    .select()
    .from(attendances)
    .where(eq(attendances.classSessionId, data.classSessionId))
    .limit(1);

  let record;
  if (existing.length > 0) {
    [record] = await db
      .update(attendances)
      .set({
        status: data.status,
        absentUnits: data.absentUnits,
        notes: data.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(attendances.classSessionId, data.classSessionId))
      .returning();
  } else {
    [record] = await db
      .insert(attendances)
      .values({
        classSessionId: data.classSessionId,
        status: data.status,
        absentUnits: data.absentUnits,
        notes: data.notes || null,
        updatedAt: new Date(),
      })
      .returning();
  }

  // If status is not NOT_RECORDED, mark session as HELD
  if (data.status !== "NOT_RECORDED") {
    await db
      .update(classSessions)
      .set({
        status: "HELD",
        updatedAt: new Date(),
      })
      .where(eq(classSessions.id, data.classSessionId));
  }

  return record;
}

export async function createClassSession(data: {
  subjectId: string;
  scheduleId?: string | null;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  absenceUnits?: number;
  status?: "SCHEDULED" | "HELD" | "CANCELED";
}) {
  const [session] = await db
    .insert(classSessions)
    .values({
      subjectId: data.subjectId,
      scheduleId: data.scheduleId || null,
      date: data.date,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      absenceUnits: data.absenceUnits ?? 1,
      status: data.status || "SCHEDULED",
      updatedAt: new Date(),
    })
    .returning();

  return session;
}

export async function updateClassSession(
  id: string,
  data: Partial<{
    date: string;
    startTime: string | null;
    endTime: string | null;
    absenceUnits: number;
    status: "SCHEDULED" | "HELD" | "CANCELED";
  }>
) {
  const [updated] = await db
    .update(classSessions)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(classSessions.id, id))
    .returning();

  return updated;
}

export async function deleteClassSession(id: string) {
  const [deleted] = await db
    .delete(classSessions)
    .where(eq(classSessions.id, id))
    .returning();

  return deleted;
}

export async function generateClassSessionsFromSchedule(subjectId: string) {
  const [subject] = await db
    .select()
    .from(subjects)
    .where(eq(subjects.id, subjectId))
    .limit(1);

  if (!subject) return { count: 0 };

  const [semester] = await db
    .select()
    .from(semesters)
    .where(eq(semesters.id, subject.semesterId))
    .limit(1);

  if (!semester) return { count: 0 };

  const schedules = await db
    .select()
    .from(subjectSchedules)
    .where(eq(subjectSchedules.subjectId, subjectId));

  if (schedules.length === 0) return { count: 0 };

  const startDate = new Date(semester.startDate + "T00:00:00");
  const endDate = new Date(semester.endDate + "T23:59:59");

  // Get existing sessions to avoid duplicate generation on the same date and time
  const existingSessions = await db
    .select({ date: classSessions.date, startTime: classSessions.startTime })
    .from(classSessions)
    .where(eq(classSessions.subjectId, subjectId));

  const existingSet = new Set(
    existingSessions.map((s) => `${s.date}_${s.startTime || ""}`)
  );

  const sessionsToInsert: Array<typeof classSessions.$inferInsert> = [];

  const curr = new Date(startDate);
  while (curr <= endDate) {
    const dayOfWeek = curr.getDay(); // 0-6
    const matchingSchedules = schedules.filter((s) => s.dayOfWeek === dayOfWeek);

    for (const sch of matchingSchedules) {
      const dateStr = curr.toISOString().split("T")[0];
      const key = `${dateStr}_${sch.startTime}`;

      if (!existingSet.has(key)) {
        sessionsToInsert.push({
          subjectId,
          scheduleId: sch.id,
          date: dateStr,
          startTime: sch.startTime,
          endTime: sch.endTime,
          absenceUnits: 1,
          status: "SCHEDULED",
          updatedAt: new Date(),
        });
        existingSet.add(key);
      }
    }

    curr.setDate(curr.getDate() + 1);
  }

  if (sessionsToInsert.length > 0) {
    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < sessionsToInsert.length; i += batchSize) {
      const batch = sessionsToInsert.slice(i, i + batchSize);
      await db.insert(classSessions).values(batch);
    }
  }

  return { count: sessionsToInsert.length };
}
