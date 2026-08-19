import { notFound } from "next/navigation";
import { getSubjectById } from "@/services/subject.service";
import { SubjectDetails } from "@/components/subject/subject-details";

export const dynamic = "force-dynamic";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subject = await getSubjectById(id);

  if (!subject) {
    notFound();
  }

  return <SubjectDetails subject={subject as any} />;
}
