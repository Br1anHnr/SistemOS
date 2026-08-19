/**
 * Grades Domain Service
 *
 * Pure functions for calculating weighted averages, projected averages,
 * required grades, and exam necessity detection.
 *
 * These functions are fully decoupled from React, database, and UI concerns.
 */

export interface GradeEntry {
  /** Grade obtained (0 to maxGrade) */
  grade: number;
  /** Weight of this component */
  weight: number;
}

export interface PendingComponent {
  /** Weight of the pending component */
  weight: number;
}

export interface GradeComponentInput {
  /** Grade obtained, or null/undefined if not yet graded */
  grade: number | null | undefined;
  /** Weight of this component */
  weight: number;
  /** Whether this component is a final exam (excluded from regular average) */
  isExam: boolean;
}

/**
 * Calculate a weighted average from a list of grade entries.
 *
 * Formula: Σ(grade × weight) / Σ(weight)
 *
 * Returns null if no entries are provided or total weight is zero.
 */
export function calculateWeightedAverage(entries: GradeEntry[]): number | null {
  if (entries.length === 0) return null;

  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  if (totalWeight === 0) return null;

  const weightedSum = entries.reduce((sum, e) => sum + e.grade * e.weight, 0);
  return weightedSum / totalWeight;
}

/**
 * Calculate the current average from grade components,
 * considering only components that have been graded and are not final exams.
 *
 * Returns null if no components have been graded yet.
 */
export function calculateCurrentAverage(
  components: GradeComponentInput[]
): number | null {
  const graded = components.filter(
    (c) => !c.isExam && c.grade != null
  ) as (GradeComponentInput & { grade: number })[];

  if (graded.length === 0) return null;

  return calculateWeightedAverage(
    graded.map((c) => ({ grade: c.grade, weight: c.weight }))
  );
}

/**
 * Calculate the projected average assuming pending (non-exam) components
 * receive a given projected grade.
 *
 * Uses all non-exam components: graded ones keep their actual grade,
 * ungraded ones use the projectedGrade value.
 *
 * Returns null if there are no non-exam components.
 */
export function calculateProjectedAverage(
  components: GradeComponentInput[],
  projectedGrade: number
): number | null {
  const nonExam = components.filter((c) => !c.isExam);
  if (nonExam.length === 0) return null;

  const entries: GradeEntry[] = nonExam.map((c) => ({
    grade: c.grade != null ? c.grade : projectedGrade,
    weight: c.weight,
  }));

  return calculateWeightedAverage(entries);
}

/**
 * Calculate the grade required on pending (ungraded, non-exam) components
 * to reach a target average.
 *
 * When multiple pending components exist, the required grade is distributed
 * assuming equal performance across all pending components.
 *
 * Returns null if there are no pending components or the target is
 * mathematically impossible (required grade < 0).
 *
 * Returns the required grade value (which may exceed maxGrade, indicating
 * the target is unreachable — the caller decides how to handle this).
 */
export function calculateRequiredGrade(
  components: GradeComponentInput[],
  targetAverage: number
): number | null {
  const nonExam = components.filter((c) => !c.isExam);
  if (nonExam.length === 0) return null;

  const graded = nonExam.filter((c) => c.grade != null) as (GradeComponentInput & {
    grade: number;
  })[];
  const pending = nonExam.filter((c) => c.grade == null);

  if (pending.length === 0) return null;

  const totalWeight = nonExam.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return null;

  const achievedWeightedSum = graded.reduce(
    (sum, c) => sum + c.grade * c.weight,
    0
  );
  const pendingTotalWeight = pending.reduce((sum, c) => sum + c.weight, 0);

  if (pendingTotalWeight === 0) return null;

  // targetAverage = (achievedWeightedSum + required * pendingTotalWeight) / totalWeight
  // required = (targetAverage * totalWeight - achievedWeightedSum) / pendingTotalWeight
  const required =
    (targetAverage * totalWeight - achievedWeightedSum) / pendingTotalWeight;

  return required;
}

/**
 * Determine whether a final exam is required based on the current average
 * and the exam trigger threshold.
 *
 * Returns null if the current average cannot be determined (no grades yet).
 */
export function requiresFinalExam(
  components: GradeComponentInput[],
  examTriggerThreshold: number
): boolean | null {
  const average = calculateCurrentAverage(components);
  if (average === null) return null;

  // Check if all non-exam components have been graded
  const nonExam = components.filter((c) => !c.isExam);
  const allGraded = nonExam.every((c) => c.grade != null);

  if (!allGraded) return null;

  return average < examTriggerThreshold;
}
