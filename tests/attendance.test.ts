import { describe, expect, it } from "vitest";
import {
  calculateAttendancePercentage,
  calculateMaximumAbsences,
  calculateRemainingAbsences,
  simulateAbsence,
  type AttendanceInput,
} from "@/domain/attendance";

describe("Attendance Domain Service", () => {
  // ─── calculateAttendancePercentage ──────────────────────────────────────

  describe("calculateAttendancePercentage", () => {
    it("should return 100% when all sessions are attended", () => {
      const records: AttendanceInput[] = [
        { session: { absenceUnits: 1, isCanceled: false }, absentUnits: 0 },
        { session: { absenceUnits: 1, isCanceled: false }, absentUnits: 0 },
        { session: { absenceUnits: 1, isCanceled: false }, absentUnits: 0 },
      ];
      expect(calculateAttendancePercentage(records)).toBe(100);
    });

    it("should calculate correctly with absences", () => {
      const records: AttendanceInput[] = [
        { session: { absenceUnits: 1, isCanceled: false }, absentUnits: 0 },
        { session: { absenceUnits: 1, isCanceled: false }, absentUnits: 1 },
        { session: { absenceUnits: 1, isCanceled: false }, absentUnits: 0 },
        { session: { absenceUnits: 1, isCanceled: false }, absentUnits: 0 },
      ];
      // 3 present out of 4 = 75%
      expect(calculateAttendancePercentage(records)).toBe(75);
    });

    it("should handle partial absences", () => {
      const records: AttendanceInput[] = [
        { session: { absenceUnits: 2, isCanceled: false }, absentUnits: 1 },
        { session: { absenceUnits: 2, isCanceled: false }, absentUnits: 0 },
      ];
      // total = 4 units, absent = 1 unit → (4-1)/4 * 100 = 75%
      expect(calculateAttendancePercentage(records)).toBe(75);
    });

    it("should exclude canceled sessions", () => {
      const records: AttendanceInput[] = [
        { session: { absenceUnits: 1, isCanceled: false }, absentUnits: 0 },
        { session: { absenceUnits: 1, isCanceled: true }, absentUnits: 1 },
        { session: { absenceUnits: 1, isCanceled: false }, absentUnits: 1 },
      ];
      // Only non-canceled: 2 sessions, 2 units total, 1 absent → (2-1)/2 * 100 = 50%
      expect(calculateAttendancePercentage(records)).toBe(50);
    });

    it("should handle sessions with multiple absence units", () => {
      const records: AttendanceInput[] = [
        { session: { absenceUnits: 2, isCanceled: false }, absentUnits: 0 },
        { session: { absenceUnits: 2, isCanceled: false }, absentUnits: 2 },
        { session: { absenceUnits: 2, isCanceled: false }, absentUnits: 0 },
        { session: { absenceUnits: 2, isCanceled: false }, absentUnits: 0 },
      ];
      // total = 8 units, absent = 2 units → (8-2)/8 * 100 = 75%
      expect(calculateAttendancePercentage(records)).toBe(75);
    });

    it("should return null for empty records", () => {
      expect(calculateAttendancePercentage([])).toBeNull();
    });

    it("should return null when all sessions are canceled", () => {
      const records: AttendanceInput[] = [
        { session: { absenceUnits: 1, isCanceled: true }, absentUnits: 0 },
        { session: { absenceUnits: 1, isCanceled: true }, absentUnits: 0 },
      ];
      expect(calculateAttendancePercentage(records)).toBeNull();
    });
  });

  // ─── calculateMaximumAbsences ───────────────────────────────────────────

  describe("calculateMaximumAbsences", () => {
    it("should calculate max absences for 75% attendance (20 units)", () => {
      // 20 * (1 - 0.75) = 5
      expect(calculateMaximumAbsences(20, 75)).toBe(5);
    });

    it("should calculate max absences for 75% attendance (40 units)", () => {
      // 40 * 0.25 = 10
      expect(calculateMaximumAbsences(40, 75)).toBe(10);
    });

    it("should floor the result for non-integer values", () => {
      // 15 * 0.25 = 3.75 → floor = 3
      expect(calculateMaximumAbsences(15, 75)).toBe(3);
    });

    it("should return 0 for 100% attendance requirement", () => {
      expect(calculateMaximumAbsences(20, 100)).toBe(0);
    });

    it("should allow all absences for 0% attendance requirement", () => {
      expect(calculateMaximumAbsences(20, 0)).toBe(20);
    });
  });

  // ─── calculateRemainingAbsences ─────────────────────────────────────────

  describe("calculateRemainingAbsences", () => {
    it("should calculate remaining absences correctly", () => {
      // totalUnits=20, current=2, min=75% → max=5, remaining=3
      expect(calculateRemainingAbsences(20, 2, 75)).toBe(3);
    });

    it("should return 0 when limit has been reached", () => {
      expect(calculateRemainingAbsences(20, 5, 75)).toBe(0);
    });

    it("should return 0 when limit has been exceeded", () => {
      expect(calculateRemainingAbsences(20, 7, 75)).toBe(0);
    });

    it("should return max when no absences yet", () => {
      expect(calculateRemainingAbsences(20, 0, 75)).toBe(5);
    });
  });

  // ─── simulateAbsence ───────────────────────────────────────────────────

  describe("simulateAbsence", () => {
    it("should simulate adding one absence", () => {
      const records: AttendanceInput[] = [
        { session: { absenceUnits: 1, isCanceled: false }, absentUnits: 0 },
        { session: { absenceUnits: 1, isCanceled: false }, absentUnits: 0 },
        { session: { absenceUnits: 1, isCanceled: false }, absentUnits: 0 },
        { session: { absenceUnits: 1, isCanceled: false }, absentUnits: 0 },
      ];
      // Current: 0 absent. After +1: (4-1)/4*100 = 75%
      expect(simulateAbsence(records, 1)).toBe(75);
    });

    it("should simulate adding multiple absences", () => {
      const records: AttendanceInput[] = [
        { session: { absenceUnits: 1, isCanceled: false }, absentUnits: 0 },
        { session: { absenceUnits: 1, isCanceled: false }, absentUnits: 1 },
        { session: { absenceUnits: 1, isCanceled: false }, absentUnits: 0 },
        { session: { absenceUnits: 1, isCanceled: false }, absentUnits: 0 },
      ];
      // Current: 1 absent. After +1: (4-2)/4*100 = 50%
      expect(simulateAbsence(records, 1)).toBe(50);
    });

    it("should exclude canceled sessions from simulation", () => {
      const records: AttendanceInput[] = [
        { session: { absenceUnits: 1, isCanceled: false }, absentUnits: 0 },
        { session: { absenceUnits: 1, isCanceled: true }, absentUnits: 0 },
        { session: { absenceUnits: 1, isCanceled: false }, absentUnits: 0 },
      ];
      // Active: 2 units, 0 absent. After +1: (2-1)/2*100 = 50%
      expect(simulateAbsence(records, 1)).toBe(50);
    });

    it("should return null for empty records", () => {
      expect(simulateAbsence([], 1)).toBeNull();
    });

    it("should handle double-unit sessions in simulation", () => {
      const records: AttendanceInput[] = [
        { session: { absenceUnits: 2, isCanceled: false }, absentUnits: 0 },
        { session: { absenceUnits: 2, isCanceled: false }, absentUnits: 0 },
        { session: { absenceUnits: 2, isCanceled: false }, absentUnits: 0 },
        { session: { absenceUnits: 2, isCanceled: false }, absentUnits: 0 },
      ];
      // Active: 8 units, 0 absent. After +2: (8-2)/8*100 = 75%
      expect(simulateAbsence(records, 2)).toBe(75);
    });
  });
});
