import { notFound } from "next/navigation";
import { getSubjectById } from "@/services/subject.service";
import { getAssessmentsBySubjectId } from "@/services/assessment.service";
import { getClassSessionsWithAttendanceBySubjectId } from "@/services/attendance.service";
import { getTopicsBySubjectId } from "@/services/topic.service";
import { getMaterialsBySubjectId } from "@/services/material.service";
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

  const [assessments, classSessions, topics, materials] = await Promise.all([
    getAssessmentsBySubjectId(id),
    getClassSessionsWithAttendanceBySubjectId(id),
    getTopicsBySubjectId(id),
    getMaterialsBySubjectId(id),
  ]);

  const fullSubject = {
    ...subject,
    assessments,
    classSessions,
    topics,
    materials,
  };

  return <SubjectDetails subject={fullSubject as any} />;
}
