import { getAllSemesters } from "@/services/semester.service";
import { SemesterList } from "@/components/semester/semester-list";
import { PageHeader } from "@/components/common/page-header";

export const dynamic = "force-dynamic";

export default async function SemesterPage() {
  const semesters = await getAllSemesters();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestão de Semestres"
        description="Gerencie os períodos acadêmicos e defina qual semestre está em andamento."
      />
      <SemesterList initialSemesters={semesters} />
    </div>
  );
}
