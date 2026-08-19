import { getActiveSemester, getAllSemesters } from "@/services/semester.service";
import { getSubjectsBySemesterId } from "@/services/subject.service";
import { getTodaySchedules, getWeeklySchedulesForSemester } from "@/services/schedule.service";
import { DashboardView, DashboardData } from "@/components/dashboard/dashboard-view";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const activeSemester = await getActiveSemester();
  const allSemesters = await getAllSemesters();

  let subjects: DashboardData["subjects"] = [];
  let todaySchedules: DashboardData["todaySchedules"] = [];
  let totalWeeklySchedulesCount = 0;

  if (activeSemester) {
    const rawSubjects = await getSubjectsBySemesterId(activeSemester.id);
    subjects = rawSubjects.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      color: s.color,
      minimumAttendancePercentage: s.minimumAttendancePercentage,
      personalDifficulty: s.personalDifficulty,
      schedules: s.schedules.map((sch) => ({
        id: sch.id,
        dayOfWeek: sch.dayOfWeek,
        startTime: sch.startTime,
        endTime: sch.endTime,
        room: sch.room,
      })),
    }));

    const rawToday = await getTodaySchedules(activeSemester.id);
    todaySchedules = rawToday.map((sch) => ({
      id: sch.id,
      dayOfWeek: sch.dayOfWeek,
      startTime: sch.startTime,
      endTime: sch.endTime,
      room: sch.room,
      subject: sch.subject
        ? {
            id: sch.subject.id,
            name: sch.subject.name,
            code: sch.subject.code,
            color: sch.subject.color,
          }
        : null,
    }));

    const weeklySchedules = await getWeeklySchedulesForSemester(activeSemester.id);
    totalWeeklySchedulesCount = weeklySchedules.length;
  }

  const dashboardData: DashboardData = {
    activeSemester: activeSemester
      ? {
          id: activeSemester.id,
          name: activeSemester.name,
          academicTerm: activeSemester.academicTerm,
          academicYear: activeSemester.academicYear,
          startDate: activeSemester.startDate,
          endDate: activeSemester.endDate,
        }
      : null,
    allSemesters: allSemesters.map((s) => ({ id: s.id, name: s.name })),
    subjects,
    todaySchedules,
    totalWeeklySchedulesCount,
  };

  return <DashboardView data={dashboardData} />;
}
