import { db } from "@/db";
import { gradingSchemes, gradeComponents } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function getGradingSchemeBySubjectId(subjectId: string) {
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
    .orderBy(asc(gradeComponents.orderIndex), asc(gradeComponents.code));

  return {
    ...scheme,
    components,
  };
}

export async function updateGradingSchemeAndComponents(
  schemeId: string,
  schemeData: {
    passingGrade: number;
    examEnabled: boolean;
    examTriggerThreshold: number;
    decimalPlaces?: number;
  },
  componentsData: Array<{
    id?: string;
    name: string;
    code: string;
    weight: number;
    maxGrade: number;
    orderIndex?: number;
    isExam?: boolean;
  }>
) {
  // Update scheme
  const [updatedScheme] = await db
    .update(gradingSchemes)
    .set({
      passingGrade: schemeData.passingGrade,
      examEnabled: schemeData.examEnabled,
      examTriggerThreshold: schemeData.examTriggerThreshold,
      decimalPlaces: schemeData.decimalPlaces ?? 2,
      updatedAt: new Date(),
    })
    .where(eq(gradingSchemes.id, schemeId))
    .returning();

  // Replace components with updated ones
  await db
    .delete(gradeComponents)
    .where(eq(gradeComponents.gradingSchemeId, schemeId));

  const newComponents = await db
    .insert(gradeComponents)
    .values(
      componentsData.map((c, idx) => ({
        gradingSchemeId: schemeId,
        name: c.name,
        code: c.code,
        weight: c.weight,
        maxGrade: c.maxGrade || 10,
        orderIndex: c.orderIndex ?? idx + 1,
        isExam: c.isExam ?? false,
        updatedAt: new Date(),
      }))
    )
    .returning();

  return {
    ...updatedScheme,
    components: newComponents,
  };
}
