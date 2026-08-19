import { getActiveSemester, getAllSemesters } from "@/services/semester.service";
import { getSubjectsBySemesterId } from "@/services/subject.service";
import { SubjectList } from "@/components/subject/subject-list";
import { PageHeader } from "@/components/common/page-header";

export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const activeSemester = await getActiveSemester();
  const allSemesters = await getAllSemesters();

  const subjects = activeSemester
    ? await getSubjectsBySemesterId(activeSemester.id)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disciplinas"
        description="Acompanhe as matérias cursadas no semestre atual, seus horários e configurações."
      />
      <SubjectList
        activeSemester={
          activeSemester
            ? { id: activeSemester.id, name: activeSemester.name }
            : null
        }
        initialSubjects={subjects}
        availableSemesters={allSemesters.map((s) => ({
          id: s.id,
          name: s.name,
        }))}
      />
    </div>
  );
}
