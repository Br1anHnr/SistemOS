export type ExerciseStatus =
  | "PENDING"
  | "RESOLVED"
  | "PARTIALLY_CORRECT"
  | "WRONG"
  | "REVIEW";

export type ExerciseAttemptResult =
  | "CORRECT"
  | "PARTIALLY_CORRECT"
  | "INCORRECT"
  | "NOT_COMPLETED";

export type ExerciseAttachmentType =
  | "STATEMENT_IMAGE"
  | "STATEMENT_FILE"
  | "REFERENCE"
  | "OTHER";

export type ExerciseAttemptAttachmentType =
  | "SOLUTION_IMAGE"
  | "CORRECTION_IMAGE"
  | "OTHER";

export interface ExerciseAttemptItem {
  id: string;
  exerciseId: string;
  attemptedAt: string | Date;
  result: ExerciseAttemptResult;
  durationMinutes?: number | null;
  difficultyPerceived?: number | null;
  notes?: string | null;
  needsReview: boolean;
  attachments?: ExerciseAttemptAttachmentItem[];
}

export interface ExerciseAttachmentItem {
  id: string;
  exerciseId: string;
  type: ExerciseAttachmentType;
  filePath: string;
  mimeType: string;
  originalName: string;
  caption?: string | null;
  orderIndex: number;
}

export interface ExerciseAttemptAttachmentItem {
  id: string;
  attemptId: string;
  type: ExerciseAttemptAttachmentType;
  filePath: string;
  mimeType: string;
  originalName: string;
  caption?: string | null;
  orderIndex: number;
}

export interface ExerciseItem {
  id: string;
  subjectId: string;
  exerciseSetId?: string | null;
  topicId?: string | null;
  title: string;
  referenceNumber?: string | null;
  statement?: string | null;
  source?: string | null;
  sourcePage?: number | null;
  difficulty?: number | null;
  status: ExerciseStatus;
  needsReview: boolean;
  orderIndex: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  archivedAt?: string | Date | null;
  // Populated relations
  attempts?: ExerciseAttemptItem[];
  attachments?: ExerciseAttachmentItem[];
  topicTitle?: string | null;
  exerciseSetTitle?: string | null;
  assessmentTitle?: string | null;
}

export interface ExerciseSetProgress {
  total: number;
  triedCount: number;
  resolvedCount: number;
  partialCount: number;
  wrongCount: number;
  reviewCount: number;
  pendingCount: number;
  progressPercentage: number;
  successRate: number;
}

export interface ExerciseSetItem {
  id: string;
  subjectId: string;
  assessmentId?: string | null;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  sourceFileName?: string | null;
  sourceFileUrl?: string | null;
  sourceFileType?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  archivedAt?: string | Date | null;
  assessmentTitle?: string | null;
  assessmentDate?: string | null;
  exercises?: ExerciseItem[];
  progress?: ExerciseSetProgress;
}

/**
 * Calculates the derived status of an exercise based on its attempts and review flag.
 */
export function calculateExerciseDerivedStatus(
  attempts: { result: ExerciseAttemptResult; attemptedAt?: Date | string }[] = [],
  needsReview = false
): ExerciseStatus {
  if (needsReview) {
    return "REVIEW";
  }

  if (!attempts || attempts.length === 0) {
    return "PENDING";
  }

  // Sort latest first
  const sorted = [...attempts].sort((a, b) => {
    const timeA = a.attemptedAt ? new Date(a.attemptedAt).getTime() : 0;
    const timeB = b.attemptedAt ? new Date(b.attemptedAt).getTime() : 0;
    return timeB - timeA;
  });

  const latest = sorted[0];

  switch (latest.result) {
    case "CORRECT":
      return "RESOLVED";
    case "PARTIALLY_CORRECT":
      return "PARTIALLY_CORRECT";
    case "INCORRECT":
    case "NOT_COMPLETED":
      return "WRONG";
    default:
      return "PENDING";
  }
}

/**
 * Calculates overall progress statistics for a collection of exercises (e.g. within an ExerciseSet or Topic).
 */
export function calculateExerciseSetProgress(
  exerciseList: {
    status?: ExerciseStatus;
    needsReview?: boolean;
    attempts?: { result: ExerciseAttemptResult; attemptedAt?: Date | string }[];
  }[] = []
): ExerciseSetProgress {
  const total = exerciseList.length;
  if (total === 0) {
    return {
      total: 0,
      triedCount: 0,
      resolvedCount: 0,
      partialCount: 0,
      wrongCount: 0,
      reviewCount: 0,
      pendingCount: 0,
      progressPercentage: 0,
      successRate: 0,
    };
  }

  let resolvedCount = 0;
  let partialCount = 0;
  let wrongCount = 0;
  let reviewCount = 0;
  let pendingCount = 0;
  let triedCount = 0;

  for (const ex of exerciseList) {
    const derivedStatus = calculateExerciseDerivedStatus(
      ex.attempts || [],
      ex.needsReview ?? false
    );

    if (ex.attempts && ex.attempts.length > 0) {
      triedCount++;
    }

    if (ex.needsReview || derivedStatus === "REVIEW") {
      reviewCount++;
    } else if (derivedStatus === "RESOLVED") {
      resolvedCount++;
    } else if (derivedStatus === "PARTIALLY_CORRECT") {
      partialCount++;
    } else if (derivedStatus === "WRONG") {
      wrongCount++;
    } else {
      pendingCount++;
    }
  }

  const progressPercentage = Math.round((resolvedCount / total) * 100);
  const successRate =
    triedCount > 0 ? Math.round((resolvedCount / triedCount) * 100) : 0;

  return {
    total,
    triedCount,
    resolvedCount,
    partialCount,
    wrongCount,
    reviewCount,
    pendingCount,
    progressPercentage,
    successRate,
  };
}

/**
 * Natural sort for exercise titles (e.g. "Questão 1" before "Questão 2" before "Questão 10").
 */
export function compareExercisesNatural(a: { title: string; referenceNumber?: string | null }, b: { title: string; referenceNumber?: string | null }) {
  const textA = a.referenceNumber ? `${a.referenceNumber} ${a.title}` : a.title;
  const textB = b.referenceNumber ? `${b.referenceNumber} ${b.title}` : b.title;
  return textA.localeCompare(textB, undefined, { numeric: true, sensitivity: "base" });
}
