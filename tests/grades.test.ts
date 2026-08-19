import { describe, expect, it } from "vitest";
import {
  calculateWeightedAverage,
  calculateCurrentAverage,
  calculateProjectedAverage,
  calculateRequiredGrade,
  requiresFinalExam,
  type GradeEntry,
  type GradeComponentInput,
} from "@/domain/grades";

describe("Grades Domain Service", () => {
  // ─── calculateWeightedAverage ───────────────────────────────────────────

  describe("calculateWeightedAverage", () => {
    it("should calculate simple average (equal weights)", () => {
      const entries: GradeEntry[] = [
        { grade: 6, weight: 1 },
        { grade: 8, weight: 1 },
      ];
      expect(calculateWeightedAverage(entries)).toBe(7);
    });

    it("should calculate weighted average with different weights", () => {
      const entries: GradeEntry[] = [
        { grade: 6, weight: 4 },
        { grade: 8, weight: 6 },
      ];
      expect(calculateWeightedAverage(entries)).toBeCloseTo(7.2);
    });

    it("should return null for empty entries", () => {
      expect(calculateWeightedAverage([])).toBeNull();
    });

    it("should return null if total weight is zero", () => {
      const entries: GradeEntry[] = [{ grade: 10, weight: 0 }];
      expect(calculateWeightedAverage(entries)).toBeNull();
    });

    it("should handle a single entry", () => {
      const entries: GradeEntry[] = [{ grade: 9, weight: 1 }];
      expect(calculateWeightedAverage(entries)).toBe(9);
    });

    it("should handle three components with different weights", () => {
      const entries: GradeEntry[] = [
        { grade: 8, weight: 3 },
        { grade: 6, weight: 3 },
        { grade: 10, weight: 4 },
      ];
      // (8*3 + 6*3 + 10*4) / (3+3+4) = (24+18+40)/10 = 82/10 = 8.2
      expect(calculateWeightedAverage(entries)).toBeCloseTo(8.2);
    });
  });

  // ─── calculateCurrentAverage ────────────────────────────────────────────

  describe("calculateCurrentAverage", () => {
    it("should calculate average of graded non-exam components only", () => {
      const components: GradeComponentInput[] = [
        { grade: 6, weight: 1, isExam: false },
        { grade: 8, weight: 1, isExam: false },
      ];
      expect(calculateCurrentAverage(components)).toBe(7);
    });

    it("should exclude exam components", () => {
      const components: GradeComponentInput[] = [
        { grade: 6, weight: 1, isExam: false },
        { grade: 8, weight: 1, isExam: false },
        { grade: 5, weight: 1, isExam: true },
      ];
      expect(calculateCurrentAverage(components)).toBe(7);
    });

    it("should exclude ungraded components", () => {
      const components: GradeComponentInput[] = [
        { grade: 6, weight: 1, isExam: false },
        { grade: null, weight: 1, isExam: false },
      ];
      expect(calculateCurrentAverage(components)).toBe(6);
    });

    it("should return null if no components have been graded", () => {
      const components: GradeComponentInput[] = [
        { grade: null, weight: 1, isExam: false },
        { grade: null, weight: 1, isExam: false },
      ];
      expect(calculateCurrentAverage(components)).toBeNull();
    });
  });

  // ─── calculateProjectedAverage ──────────────────────────────────────────

  describe("calculateProjectedAverage", () => {
    it("should project average filling ungraded components with projected grade", () => {
      const components: GradeComponentInput[] = [
        { grade: 6, weight: 1, isExam: false },
        { grade: null, weight: 1, isExam: false },
      ];
      // (6*1 + 7*1) / (1+1) = 13/2 = 6.5
      expect(calculateProjectedAverage(components, 7)).toBeCloseTo(6.5);
    });

    it("should return actual average when all components are graded", () => {
      const components: GradeComponentInput[] = [
        { grade: 6, weight: 1, isExam: false },
        { grade: 8, weight: 1, isExam: false },
      ];
      expect(calculateProjectedAverage(components, 10)).toBe(7);
    });

    it("should exclude exam components from projection", () => {
      const components: GradeComponentInput[] = [
        { grade: 6, weight: 1, isExam: false },
        { grade: null, weight: 1, isExam: false },
        { grade: null, weight: 1, isExam: true },
      ];
      expect(calculateProjectedAverage(components, 8)).toBeCloseTo(7);
    });
  });

  // ─── calculateRequiredGrade ─────────────────────────────────────────────

  describe("calculateRequiredGrade", () => {
    it("should calculate required grade for equal weights (P1=6, target=5)", () => {
      const components: GradeComponentInput[] = [
        { grade: 6, weight: 1, isExam: false },
        { grade: null, weight: 1, isExam: false },
      ];
      // target=5: (6*1 + x*1) / 2 = 5 → x = 4
      expect(calculateRequiredGrade(components, 5)).toBe(4);
    });

    it("should calculate required grade for different weights", () => {
      const components: GradeComponentInput[] = [
        { grade: 6, weight: 4, isExam: false },
        { grade: null, weight: 6, isExam: false },
      ];
      // target=5: (6*4 + x*6) / (4+6) = 5 → 24 + 6x = 50 → 6x = 26 → x ≈ 4.333
      expect(calculateRequiredGrade(components, 5)).toBeCloseTo(4.333, 2);
    });

    it("should calculate required grade with weight 4/6 and target 7", () => {
      const components: GradeComponentInput[] = [
        { grade: 6, weight: 4, isExam: false },
        { grade: null, weight: 6, isExam: false },
      ];
      // target=7: (6*4 + x*6) / (4+6) = 7 → 24 + 6x = 70 → 6x = 46 → x ≈ 7.667
      expect(calculateRequiredGrade(components, 7)).toBeCloseTo(7.667, 2);
    });

    it("should return null when all components are graded", () => {
      const components: GradeComponentInput[] = [
        { grade: 6, weight: 1, isExam: false },
        { grade: 8, weight: 1, isExam: false },
      ];
      expect(calculateRequiredGrade(components, 5)).toBeNull();
    });

    it("should return null when there are no non-exam components", () => {
      const components: GradeComponentInput[] = [
        { grade: null, weight: 1, isExam: true },
      ];
      expect(calculateRequiredGrade(components, 5)).toBeNull();
    });

    it("should return negative value when target is easily achievable", () => {
      const components: GradeComponentInput[] = [
        { grade: 10, weight: 1, isExam: false },
        { grade: null, weight: 1, isExam: false },
      ];
      // target=3: (10*1 + x*1)/2 = 3 → x = -4
      expect(calculateRequiredGrade(components, 3)).toBe(-4);
    });

    it("should exclude exam components from calculation", () => {
      const components: GradeComponentInput[] = [
        { grade: 6, weight: 1, isExam: false },
        { grade: null, weight: 1, isExam: false },
        { grade: null, weight: 1, isExam: true },
      ];
      expect(calculateRequiredGrade(components, 5)).toBe(4);
    });
  });

  // ─── requiresFinalExam ──────────────────────────────────────────────────

  describe("requiresFinalExam", () => {
    it("should return true when average is below threshold (4.99 < 5)", () => {
      const components: GradeComponentInput[] = [
        { grade: 4.99, weight: 1, isExam: false },
        { grade: 4.99, weight: 1, isExam: false },
      ];
      expect(requiresFinalExam(components, 5)).toBe(true);
    });

    it("should return false when average equals threshold (5 >= 5)", () => {
      const components: GradeComponentInput[] = [
        { grade: 5, weight: 1, isExam: false },
        { grade: 5, weight: 1, isExam: false },
      ];
      expect(requiresFinalExam(components, 5)).toBe(false);
    });

    it("should return false when average is above threshold", () => {
      const components: GradeComponentInput[] = [
        { grade: 8, weight: 1, isExam: false },
        { grade: 7, weight: 1, isExam: false },
      ];
      expect(requiresFinalExam(components, 5)).toBe(false);
    });

    it("should return null when not all non-exam components are graded", () => {
      const components: GradeComponentInput[] = [
        { grade: 3, weight: 1, isExam: false },
        { grade: null, weight: 1, isExam: false },
      ];
      expect(requiresFinalExam(components, 5)).toBeNull();
    });

    it("should return null when no components are graded", () => {
      const components: GradeComponentInput[] = [
        { grade: null, weight: 1, isExam: false },
        { grade: null, weight: 1, isExam: false },
      ];
      expect(requiresFinalExam(components, 5)).toBeNull();
    });

    it("should work with weighted averages for exam detection", () => {
      const components: GradeComponentInput[] = [
        { grade: 3, weight: 4, isExam: false },
        { grade: 6, weight: 6, isExam: false },
      ];
      // average = (3*4 + 6*6) / (4+6) = (12+36)/10 = 4.8 < 5
      expect(requiresFinalExam(components, 5)).toBe(true);
    });
  });
});
