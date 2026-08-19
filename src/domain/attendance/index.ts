/**
 * Attendance Domain Service
 *
 * Pure functions for calculating attendance percentage, maximum/remaining
 * absences, and simulating future absences.
 *
 * Works with absence *units*, not raw record counts, to correctly handle
 * sessions that are worth more than one absence unit (e.g., double-period classes).
 *
 * Canceled sessions are excluded from all calculations.
 */

export interface ClassSessionInput {
  /** Number of absence units this session is worth */
  absenceUnits: number;
  /** Whether the session was canceled */
  isCanceled: boolean;
}

export interface AttendanceInput {
  /** The class session this attendance record belongs to */
  session: ClassSessionInput;
  /** Number of units the student was absent for */
  absentUnits: number;
}

/**
 * Calculate the attendance percentage based on attendance records.
 *
 * Formula: (totalUnits - absentUnits) / totalUnits × 100
 *
 * Canceled sessions are excluded.
 *
 * Returns null if there are no non-canceled sessions.
 */
export function calculateAttendancePercentage(
  records: AttendanceInput[]
): number | null {
  const activeRecords = records.filter((r) => !r.session.isCanceled);
  if (activeRecords.length === 0) return null;

  const totalUnits = activeRecords.reduce(
    (sum, r) => sum + r.session.absenceUnits,
    0
  );
  if (totalUnits === 0) return null;

  const totalAbsentUnits = activeRecords.reduce(
    (sum, r) => sum + r.absentUnits,
    0
  );

  return ((totalUnits - totalAbsentUnits) / totalUnits) * 100;
}

/**
 * Calculate the maximum number of absence units allowed for a subject
 * given the total number of absence units and the minimum attendance percentage.
 *
 * Formula: totalUnits × (1 - minimumAttendancePercentage / 100)
 *
 * Uses Math.floor because you can only miss whole units.
 */
export function calculateMaximumAbsences(
  totalUnits: number,
  minimumAttendancePercentage: number
): number {
  return Math.floor(totalUnits * (1 - minimumAttendancePercentage / 100));
}

/**
 * Calculate how many more absence units the student can still accumulate
 * before exceeding the limit.
 *
 * Returns 0 if the limit has already been exceeded.
 *
 * @param totalUnits Total absence units for all non-canceled sessions (past + future)
 * @param currentAbsentUnits Units already missed
 * @param minimumAttendancePercentage Minimum attendance percentage (e.g., 75)
 */
export function calculateRemainingAbsences(
  totalUnits: number,
  currentAbsentUnits: number,
  minimumAttendancePercentage: number
): number {
  const maxAbsences = calculateMaximumAbsences(
    totalUnits,
    minimumAttendancePercentage
  );
  return Math.max(0, maxAbsences - currentAbsentUnits);
}

/**
 * Simulate the attendance percentage after adding a given number
 * of additional absent units.
 *
 * Returns null if there are no non-canceled sessions.
 */
export function simulateAbsence(
  records: AttendanceInput[],
  additionalAbsentUnits: number
): number | null {
  const activeRecords = records.filter((r) => !r.session.isCanceled);
  if (activeRecords.length === 0) return null;

  const totalUnits = activeRecords.reduce(
    (sum, r) => sum + r.session.absenceUnits,
    0
  );
  if (totalUnits === 0) return null;

  const currentAbsentUnits = activeRecords.reduce(
    (sum, r) => sum + r.absentUnits,
    0
  );

  const projectedAbsent = currentAbsentUnits + additionalAbsentUnits;
  return ((totalUnits - projectedAbsent) / totalUnits) * 100;
}
