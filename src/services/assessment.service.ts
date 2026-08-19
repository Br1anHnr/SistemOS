import { db } from "@/db";
import {
  assessments,
  assessmentResults,
  gradeComponents,
  gradingSchemes,
  subjects,
} from "@/db/schema";
import { asc, desc, eq, inArray, gte, and, isNotNull } from "drizzle-orm";
import {
  calculateCurrentAverage,
  calculateProjectedAverage,
  calculateRequiredGrade,
  requiresFinalExam,
  GradeComponentInput,
} from "@/domain/grades";

export async function getAssessmentsBySubjectId(subjectId: string) {
  const assessmentList = await db
    .select()
    .from(assessments)
    .where(eq(assessments.subjectId, subjectId))
    .orderBy(asc(assessments.date), asc(assessments.createdAt));

  if (assessmentList.length === 0) return [];

  const assessmentIds = assessmentList.map((a) => a.id);

  const results = await db
    .select()
    .from(assessmentResults)
    .where(inArray(assessmentResults.assessmentId, assessmentIds));

  const resultMap = new Map(results.map((r) => [r.assessmentId, r]));

  // Get grade components for this subject if any
  const [scheme] = await db
    .select()
    .from(gradingSchemes)
    .where(eq(gradingSchemes.subjectId, subjectId))
    .limit(1);

  let componentsMap = new Map<string, typeof gradeComponents.$inferSelect>();
  if (scheme) {
    const components = await db
      .select()
      .from(gradeComponents)
      .where(eq(gradeComponents.gradingSchemeId, scheme.id));
    componentsMap = new Map(components.map((c) => [c.id, c]));
  }

  return assessmentList.map((a) => ({
    ...a,
    result: resultMap.get(a.id) || null,
    gradeComponent: a.gradeComponentId ? componentsMap.get(a.gradeComponentId) || null : null,
  }));
}

export async function getUpcomingAssessmentsForSemester(semesterId: string) {
  const subjectList = await db
    .select({
      id: subjects.id,
      name: subjects.name,
      code: subjects.code,
      color: subjects.color,
    })
    .from(subjects)
    .where(eq(subjects.semesterId, semesterId));

  if (subjectList.length === 0) return [];

  const subjectIds = subjectList.map((s) => s.id);
  const subjectMap = new Map(subjectList.map((s) => [s.id, s]));

  const todayStr = new Date().toISOString().split("T")[0];

  const upcoming = await db
    .select()
    .from(assessments)
    .where(
      and(
        inArray(assessments.subjectId, subjectIds),
        gte(assessments.date, todayStr)
      )
    )
    .orderBy(asc(assessments.date));

  const assessmentIds = upcoming.map((a) => a.id);
  let resultsMap = new Map<string, typeof assessmentResults.$inferSelect>();
  if (assessmentIds.length > 0) {
    const results = await db
      .select()
      .from(assessmentResults)
      .where(inArray(assessmentResults.assessmentId, assessmentIds));
    resultsMap = new Map(results.map((r) => [r.assessmentId, r]));
  }

  return upcoming.map((a) => ({
    ...a,
    subject: subjectMap.get(a.subjectId) || null,
    result: resultsMap.get(a.id) || null,
  }));
}

export async function getAllAssessmentsForSemester(semesterId: string) {
  const subjectList = await db
    .select({
      id: subjects.id,
      name: subjects.name,
      code: subjects.code,
      color: subjects.color,
    })
    .from(subjects)
    .where(eq(subjects.semesterId, semesterId));

  if (subjectList.length === 0) return [];

  const subjectIds = subjectList.map((s) => s.id);
  const subjectMap = new Map(subjectList.map((s) => [s.id, s]));

  const all = await db
    .select()
    .from(assessments)
    .where(inArray(assessments.subjectId, subjectIds))
    .orderBy(asc(assessments.date), desc(assessments.createdAt));

  const assessmentIds = all.map((a) => a.id);
  let resultsMap = new Map<string, typeof assessmentResults.$inferSelect>();
  if (assessmentIds.length > 0) {
    const results = await db
      .select()
      .from(assessmentResults)
      .where(inArray(assessmentResults.assessmentId, assessmentIds));
    resultsMap = new Map(results.map((r) => [r.assessmentId, r]));
  }

  return all.map((a) => ({
    ...a,
    subject: subjectMap.get(a.subjectId) || null,
    result: resultsMap.get(a.id) || null,
  }));
}

export async function getSubjectGradesSummary(subjectId: string) {
  const [scheme] = await db
    .select()
    .from(gradingSchemes)
    .where(eq(gradingSchemes.subjectId, subjectId))
    .limit(1);

  if (!scheme) return null;

  const components = await db
    .select()
    .from(gradeComponents)
    .where(eq(gradeComponents.gradingSchemeId, scheme.id))
    .orderBy(asc(gradeComponents.orderIndex));

  const allAssessments = await getAssessmentsBySubjectId(subjectId);

  // Map each component to its latest assessment grade
  const componentInputs: GradeComponentInput[] = components.map((comp) => {
    // Find assessment linked directly or by matching code
    const matchingAssessment = allAssessments.find(
      (a) => a.gradeComponentId === comp.id || a.title.toLowerCase().includes(comp.code.toLowerCase())
    );

    const grade = matchingAssessment?.result ? matchingAssessment.result.grade : null;

    return {
      grade,
      weight: comp.weight,
      isExam: comp.isExam,
    };
  });

  const currentAverage = calculateCurrentAverage(componentInputs);
  const requiredForPassing = calculateRequiredGrade(componentInputs, scheme.passingGrade);
  const isExamNeeded = requiresFinalExam(componentInputs, scheme.examTriggerThreshold);

  const nonExamComponents = componentInputs.filter((c) => !c.isExam);
  const allGraded = nonExamComponents.length > 0 && nonExamComponents.every((c) => c.grade != null);

  let status: "APPROVED" | "EXAM_REQUIRED" | "IN_PROGRESS" | "NOT_STARTED" = "NOT_STARTED";

  if (currentAverage === null) {
    status = "NOT_STARTED";
  } else if (allGraded) {
    if (currentAverage >= scheme.passingGrade) {
      status = "APPROVED";
    } else if (isExamNeeded) {
      status = "EXAM_REQUIRED";
    } else {
      status = "IN_PROGRESS";
    }
  } else {
    status = "IN_PROGRESS";
  }

  return {
    scheme,
    components,
    assessments: allAssessments,
    componentInputs,
    currentAverage,
    requiredForPassing,
    isExamNeeded,
    allGraded,
    status,
  };
}

export async function createAssessment(data: {
  subjectId: string;
  gradeComponentId?: string | null;
  title: string;
  type?: "EXAM" | "FINAL_EXAM" | "ASSIGNMENT" | "OTHER";
  date?: string | null;
  maxGrade?: number;
  status?: "SCHEDULED" | "COMPLETED" | "CANCELED";
  notes?: string | null;
  grade?: number | null;
}) {
  const initialStatus = data.grade != null ? "COMPLETED" : data.status || "SCHEDULED";

  const [newAssessment] = await db
    .insert(assessments)
    .values({
      subjectId: data.subjectId,
      gradeComponentId: data.gradeComponentId || null,
      title: data.title,
      type: data.type || "EXAM",
      date: data.date || null,
      maxGrade: data.maxGrade ?? 10,
      status: initialStatus,
      notes: data.notes || null,
      updatedAt: new Date(),
    })
    .returning();

  if (data.grade != null) {
    await db.insert(assessmentResults).values({
      assessmentId: newAssessment.id,
      grade: data.grade,
      gradedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return newAssessment;
}

export async function updateAssessment(
  id: string,
  data: Partial<{
    gradeComponentId: string | null;
    title: string;
    type: "EXAM" | "FINAL_EXAM" | "ASSIGNMENT" | "OTHER";
    date: string | null;
    maxGrade: number;
    status: "SCHEDULED" | "COMPLETED" | "CANCELED";
    notes: string | null;
  }>
) {
  const [updated] = await db
    .update(assessments)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(assessments.id, id))
    .returning();

  return updated;
}

export async function deleteAssessment(id: string) {
  const [deleted] = await db
    .delete(assessments)
    .where(eq(assessments.id, id))
    .returning();

  return deleted;
}

export async function saveAssessmentResult(
  assessmentId: string,
  grade: number,
  notes?: string | null
) {
  // Upsert result
  const existing = await db
    .select()
    .from(assessmentResults)
    .where(eq(assessmentResults.assessmentId, assessmentId))
    .limit(1);

  let result;
  if (existing.length > 0) {
    [result] = await db
      .update(assessmentResults)
      .set({
        grade,
        notes: notes || null,
        gradedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(assessmentResults.assessmentId, assessmentId))
      .returning();
  } else {
    [result] = await db
      .insert(assessmentResults)
      .values({
        assessmentId,
        grade,
        notes: notes || null,
        gradedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
  }

  // Automatically update assessment status to COMPLETED
  await db
    .update(assessments)
    .set({
      status: "COMPLETED",
      updatedAt: new Date(),
    })
    .where(eq(assessments.id, assessmentId));

  return result;
}

export async function deleteAssessmentResult(assessmentId: string) {
  const [deleted] = await db
    .delete(assessmentResults)
    .where(eq(assessmentResults.assessmentId, assessmentId))
    .returning();

  await db
    .update(assessments)
    .set({
      status: "SCHEDULED",
      updatedAt: new Date(),
    })
    .where(eq(assessments.id, assessmentId));

  return deleted;
}
