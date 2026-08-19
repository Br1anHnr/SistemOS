import { getActiveSemester } from "@/services/semester.service";
import { getSemesterAttendanceSummary } from "@/services/attendance.service";
import { AttendanceOverview } from "@/components/attendance/attendance-overview";
import { PageHeader } from "@/components/common/page-header";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const activeSemester = await getActiveSemester();

  let subjectsAttendance: any[] = [];
  if (activeSemester) {
    subjectsAttendance = await getSemesterAttendanceSummary(activeSemester.id);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Frequência & Faltas"
        description="Acompanhe suas presenças, faltas acumuladas e limites máximos em todas as disciplinas."
      />
      <AttendanceOverview
        activeSemester={
          activeSemester
            ? { id: activeSemester.id, name: activeSemester.name }
            : null
        }
        subjectsAttendance={subjectsAttendance}
      />
    </div>
  );
}
