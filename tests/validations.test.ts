import { describe, expect, it } from "vitest";
import {
  createSemesterSchema,
  createSubjectSchema,
  createSubjectScheduleSchema,
  updateGradingSchemeWithComponentsSchema,
  createAssessmentSchema,
  saveGradeSchema,
  createClassSessionSchema,
  recordAttendanceSchema,
  createTopicSchema,
  updateTopicMasterySchema,
} from "@/validations";

describe("Zod Validations for Academic Entities", () => {
  describe("createSemesterSchema", () => {
    it("should accept valid semester data", () => {
      const valid = {
        name: "2026.1",
        academicYear: "2026",
        academicTerm: "1º Semestre",
        startDate: "2026-02-01",
        endDate: "2026-06-30",
        status: "ACTIVE" as const,
      };

      const result = createSemesterSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should fail when endDate is before or equal to startDate", () => {
      const invalid = {
        name: "2026.1",
        academicYear: "2026",
        academicTerm: "1º Semestre",
        startDate: "2026-06-30",
        endDate: "2026-02-01",
      };

      const result = createSemesterSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "A data final deve ser posterior à data inicial."
        );
      }
    });

    it("should fail when name is empty", () => {
      const invalid = {
        name: "",
        academicYear: "2026",
        academicTerm: "1º Semestre",
        startDate: "2026-02-01",
        endDate: "2026-06-30",
      };

      const result = createSemesterSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("createSubjectSchema", () => {
    it("should accept valid subject data", () => {
      const valid = {
        semesterId: "123e4567-e89b-12d3-a456-426614174000",
        name: "Cálculo I",
        code: "MAT01",
        professor: "Prof. Silva",
        minimumAttendancePercentage: 75,
        personalDifficulty: 4,
      };

      const result = createSubjectSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should fail when minimum attendance is out of bounds", () => {
      const invalid = {
        semesterId: "123e4567-e89b-12d3-a456-426614174000",
        name: "Cálculo I",
        minimumAttendancePercentage: 110,
      };

      const result = createSubjectSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should fail when personal difficulty is greater than 5", () => {
      const invalid = {
        semesterId: "123e4567-e89b-12d3-a456-426614174000",
        name: "Cálculo I",
        personalDifficulty: 6,
      };

      const result = createSubjectSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("createSubjectScheduleSchema", () => {
    it("should accept valid schedule", () => {
      const valid = {
        subjectId: "123e4567-e89b-12d3-a456-426614174000",
        dayOfWeek: 2,
        startTime: "19:00",
        endTime: "20:40",
      };

      const result = createSubjectScheduleSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should fail when endTime is before startTime", () => {
      const invalid = {
        subjectId: "123e4567-e89b-12d3-a456-426614174000",
        dayOfWeek: 2,
        startTime: "20:40",
        endTime: "19:00",
      };

      const result = createSubjectScheduleSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "O horário final deve ser posterior ao horário inicial."
        );
      }
    });
  });

  describe("updateGradingSchemeWithComponentsSchema", () => {
    it("should accept valid grading scheme with components", () => {
      const valid = {
        schemeId: "123e4567-e89b-12d3-a456-426614174000",
        passingGrade: 5,
        examEnabled: true,
        examTriggerThreshold: 5,
        decimalPlaces: 2,
        components: [
          { name: "Prova 1", code: "P1", weight: 4, maxGrade: 10 },
          { name: "Prova 2", code: "P2", weight: 6, maxGrade: 10 },
        ],
      };

      const result = updateGradingSchemeWithComponentsSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject negative or zero weights", () => {
      const invalid = {
        schemeId: "123e4567-e89b-12d3-a456-426614174000",
        passingGrade: 5,
        examEnabled: true,
        examTriggerThreshold: 5,
        decimalPlaces: 2,
        components: [
          { name: "Prova 1", code: "P1", weight: 0, maxGrade: 10 },
        ],
      };

      const result = updateGradingSchemeWithComponentsSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("createAssessmentSchema & saveGradeSchema", () => {
    it("should accept valid assessment creation data", () => {
      const valid = {
        subjectId: "123e4567-e89b-12d3-a456-426614174000",
        title: "Prova 1 (P1)",
        type: "EXAM" as const,
        date: "2026-04-15",
        maxGrade: 10,
        grade: 8.5,
      };

      const result = createAssessmentSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should validate grade range in saveGradeSchema", () => {
      const valid = {
        assessmentId: "123e4567-e89b-12d3-a456-426614174000",
        grade: 9.25,
      };
      expect(saveGradeSchema.safeParse(valid).success).toBe(true);

      const negative = {
        assessmentId: "123e4567-e89b-12d3-a456-426614174000",
        grade: -1,
      };
      expect(saveGradeSchema.safeParse(negative).success).toBe(false);
    });
  });

  describe("createClassSessionSchema & recordAttendanceSchema", () => {
    it("should validate class session data", () => {
      const valid = {
        subjectId: "123e4567-e89b-12d3-a456-426614174000",
        date: "2026-03-10",
        startTime: "19:00",
        endTime: "20:40",
        absenceUnits: 2,
      };
      expect(createClassSessionSchema.safeParse(valid).success).toBe(true);
    });

    it("should validate attendance record status and absent units", () => {
      const valid = {
        classSessionId: "123e4567-e89b-12d3-a456-426614174000",
        status: "ABSENT" as const,
        absentUnits: 1,
      };
      expect(recordAttendanceSchema.safeParse(valid).success).toBe(true);

      const invalidUnits = {
        classSessionId: "123e4567-e89b-12d3-a456-426614174000",
        status: "ABSENT" as const,
        absentUnits: -1,
      };
      expect(recordAttendanceSchema.safeParse(invalidUnits).success).toBe(false);
    });
  });

  describe("createTopicSchema & updateTopicMasterySchema", () => {
    it("should validate topic creation data", () => {
      const valid = {
        subjectId: "123e4567-e89b-12d3-a456-426614174000",
        title: "Regra da Cadeia",
        masteryLevel: 2,
        importance: 4,
        estimatedHours: 3.5,
      };
      expect(createTopicSchema.safeParse(valid).success).toBe(true);
    });

    it("should reject mastery level out of range 0-4", () => {
      const invalid = {
        subjectId: "123e4567-e89b-12d3-a456-426614174000",
        title: "Regra da Cadeia",
        masteryLevel: 5,
      };
      expect(createTopicSchema.safeParse(invalid).success).toBe(false);
    });

    it("should validate updateTopicMasterySchema", () => {
      const valid = {
        topicId: "123e4567-e89b-12d3-a456-426614174000",
        masteryLevel: 4,
      };
      expect(updateTopicMasterySchema.safeParse(valid).success).toBe(true);
    });
  });
});
