import { getActiveSemester } from "@/services/semester.service";
import { getSubjectsBySemesterId } from "@/services/subject.service";
import { getAllAssessmentsForSemester } from "@/services/assessment.service";
import { AssessmentsOverview } from "@/components/assessment/assessments-overview";
import { PageHeader } from "@/components/common/page-header";

export const dynamic = "force-dynamic";

export default async function AssessmentsPage() {
  const activeSemester = await getActiveSemester();

  let assessments: any[] = [];
  let subjects: Array<{ id: string; name: string }> = [];

  if (activeSemester) {
    const rawSubjects = await getSubjectsBySemesterId(activeSemester.id);
    subjects = rawSubjects.map((s) => ({ id: s.id, name: s.name }));
    assessments = await getAllAssessmentsForSemester(activeSemester.id);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Avaliações & Provas"
        description="Acompanhe todas as provas, trabalhos e notas do semestre ativo."
      />
      <AssessmentsOverview
        activeSemester={
          activeSemester
            ? { id: activeSemester.id, name: activeSemester.name }
            : null
        }
        assessments={assessments}
        subjects={subjects}
      />
    </div>
  );
}
