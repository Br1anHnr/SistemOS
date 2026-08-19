import { describe, expect, it } from "vitest";
import {
  calculateExerciseDerivedStatus,
  calculateExerciseSetProgress,
  compareExercisesNatural,
  ExerciseItem,
  ExerciseAttemptItem,
} from "@/domain/exercises";
import {
  createExerciseSetSchema,
  updateExerciseSetSchema,
  createExerciseSchema,
  updateExerciseSchema,
  createExerciseAttemptSchema,
  exerciseStatusSchema,
  exerciseAttemptResultSchema,
} from "@/validations";

describe("Domain & Validations: Exercises (Exercícios)", () => {
  const validSubjectId = "550e8400-e29b-41d4-a716-446655440000";
  const validExerciseSetId = "660e8400-e29b-41d4-a716-446655440000";
  const validTopicId = "770e8400-e29b-41d4-a716-446655440000";
  const validExerciseId = "880e8400-e29b-41d4-a716-446655440000";

  describe("Zod Validations", () => {
    it("should validate createExerciseSetSchema with valid fields", () => {
      const valid = {
        subjectId: validSubjectId,
        title: "Lista 01 - Estática dos Fluidos",
        description: "Exercícios selecionados do capítulo 3",
        dueDate: "2026-09-15",
        sourceFileName: "lista1.pdf",
        sourceFileUrl: "indexeddb://files/lista1.pdf",
        sourceFileType: "PDF" as const,
      };

      const result = createExerciseSetSchema.parse(valid);
      expect(result.title).toBe("Lista 01 - Estática dos Fluidos");
      expect(result.subjectId).toBe(validSubjectId);
      expect(result.sourceFileType).toBe("PDF");
    });

    it("should reject createExerciseSetSchema with empty title", () => {
      const invalid = {
        subjectId: validSubjectId,
        title: "",
      };
      expect(() => createExerciseSetSchema.parse(invalid)).toThrow();
    });

    it("should validate createExerciseSchema with attachments and context", () => {
      const valid = {
        subjectId: validSubjectId,
        exerciseSetId: validExerciseSetId,
        topicId: validTopicId,
        title: "Questão 1: Manômetro de Coluna Dupla",
        referenceNumber: "Q01",
        difficulty: 4,
        statement: "Calcule a pressão manométrica no ponto A sabendo que...",
        source: "Halliday & Resnick",
        sourcePage: 42,
        statementImages: [
          {
            filePath: "indexeddb://files/fig1.png",
            mimeType: "image/png",
            originalName: "figura1.png",
            caption: "Diagrama do tubo em U",
          },
        ],
      };

      const result = createExerciseSchema.parse(valid);
      expect(result.title).toBe("Questão 1: Manômetro de Coluna Dupla");
      expect(result.referenceNumber).toBe("Q01");
      expect(result.difficulty).toBe(4);
      expect(result.statementImages?.length).toBe(1);
    });

    it("should validate createExerciseAttemptSchema with resolution photos", () => {
      const valid = {
        exerciseId: validExerciseId,
        result: "CORRECT" as const,
        durationMinutes: 25,
        difficultyPerceived: 3,
        notes: "Resolvido aplicando o princípio de Pascal.",
        needsReview: false,
        attachments: [
          {
            filePath: "indexeddb://files/caderno_p1.jpg",
            mimeType: "image/jpeg",
            originalName: "caderno_p1.jpg",
            caption: "Página 1 do rascunho",
          },
        ],
      };

      const result = createExerciseAttemptSchema.parse(valid);
      expect(result.result).toBe("CORRECT");
      expect(result.durationMinutes).toBe(25);
      expect(result.attachments?.length).toBe(1);
    });

    it("should validate allowed status and attempt results", () => {
      expect(exerciseStatusSchema.parse("PENDING")).toBe("PENDING");
      expect(exerciseStatusSchema.parse("RESOLVED")).toBe("RESOLVED");
      expect(exerciseStatusSchema.parse("PARTIALLY_CORRECT")).toBe("PARTIALLY_CORRECT");
      expect(exerciseStatusSchema.parse("WRONG")).toBe("WRONG");
      expect(exerciseStatusSchema.parse("REVIEW")).toBe("REVIEW");

      expect(exerciseAttemptResultSchema.parse("CORRECT")).toBe("CORRECT");
      expect(exerciseAttemptResultSchema.parse("PARTIALLY_CORRECT")).toBe("PARTIALLY_CORRECT");
      expect(exerciseAttemptResultSchema.parse("INCORRECT")).toBe("INCORRECT");
      expect(exerciseAttemptResultSchema.parse("NOT_COMPLETED")).toBe("NOT_COMPLETED");
    });
  });

  describe("Domain: calculateExerciseDerivedStatus", () => {
    it("should return PENDING when no attempts exist and needsReview is false", () => {
      const status = calculateExerciseDerivedStatus([], false);
      expect(status).toBe("PENDING");
    });

    it("should return REVIEW when no attempts exist but needsReview is true", () => {
      const status = calculateExerciseDerivedStatus([], true);
      expect(status).toBe("REVIEW");
    });

    it("should return RESOLVED when last attempt is CORRECT and needsReview is false", () => {
      const attempts: ExerciseAttemptItem[] = [
        {
          id: "att-1",
          exerciseId: "ex-1",
          attemptedAt: "2026-08-10T10:00:00Z",
          result: "INCORRECT",
          needsReview: false,
        },
        {
          id: "att-2",
          exerciseId: "ex-1",
          attemptedAt: "2026-08-11T10:00:00Z",
          result: "CORRECT",
          needsReview: false,
        },
      ];

      const status = calculateExerciseDerivedStatus(attempts, false);
      expect(status).toBe("RESOLVED");
    });

    it("should return REVIEW when last attempt is CORRECT but needsReview is explicitly true", () => {
      const attempts: ExerciseAttemptItem[] = [
        {
          id: "att-1",
          exerciseId: "ex-1",
          attemptedAt: "2026-08-11T10:00:00Z",
          result: "CORRECT",
          needsReview: true,
        },
      ];

      const status = calculateExerciseDerivedStatus(attempts, true);
      expect(status).toBe("REVIEW");
    });

    it("should return PARTIALLY_CORRECT when last attempt is PARTIALLY_CORRECT and not in review", () => {
      const attempts: ExerciseAttemptItem[] = [
        {
          id: "att-1",
          exerciseId: "ex-1",
          attemptedAt: "2026-08-11T10:00:00Z",
          result: "PARTIALLY_CORRECT",
          needsReview: false,
        },
      ];

      const status = calculateExerciseDerivedStatus(attempts, false);
      expect(status).toBe("PARTIALLY_CORRECT");
    });

    it("should return WRONG when last attempt is INCORRECT and not in review", () => {
      const attempts: ExerciseAttemptItem[] = [
        {
          id: "att-1",
          exerciseId: "ex-1",
          attemptedAt: "2026-08-11T10:00:00Z",
          result: "INCORRECT",
          needsReview: false,
        },
      ];

      const status = calculateExerciseDerivedStatus(attempts, false);
      expect(status).toBe("WRONG");
    });
  });

  describe("Domain: calculateExerciseSetProgress", () => {
    it("should return zeros for an empty exercise list", () => {
      const progress = calculateExerciseSetProgress([]);
      expect(progress.total).toBe(0);
      expect(progress.resolvedCount).toBe(0);
      expect(progress.progressPercentage).toBe(0);
      expect(progress.successRate).toBe(0);
    });

    it("should compute correct progress percentages and success rates", () => {
      const dummyExercises: ExerciseItem[] = [
        {
          id: "e1",
          subjectId: validSubjectId,
          title: "Q1",
          orderIndex: 1,
          createdAt: "2026-08-01",
          updatedAt: "2026-08-01",
          status: "RESOLVED",
          needsReview: false,
          attempts: [{ id: "a1", exerciseId: "e1", attemptedAt: "2026-08-01", result: "CORRECT", needsReview: false }],
        },
        {
          id: "e2",
          subjectId: validSubjectId,
          title: "Q2",
          orderIndex: 2,
          createdAt: "2026-08-01",
          updatedAt: "2026-08-01",
          status: "RESOLVED",
          needsReview: false,
          attempts: [{ id: "a2", exerciseId: "e2", attemptedAt: "2026-08-01", result: "CORRECT", needsReview: false }],
        },
        {
          id: "e3",
          subjectId: validSubjectId,
          title: "Q3",
          orderIndex: 3,
          createdAt: "2026-08-01",
          updatedAt: "2026-08-01",
          status: "PARTIALLY_CORRECT",
          needsReview: false,
          attempts: [{ id: "a3", exerciseId: "e3", attemptedAt: "2026-08-01", result: "PARTIALLY_CORRECT", needsReview: false }],
        },
        {
          id: "e4",
          subjectId: validSubjectId,
          title: "Q4",
          orderIndex: 4,
          createdAt: "2026-08-01",
          updatedAt: "2026-08-01",
          status: "WRONG",
          needsReview: false,
          attempts: [{ id: "a4", exerciseId: "e4", attemptedAt: "2026-08-01", result: "INCORRECT", needsReview: false }],
        },
        {
          id: "e5",
          subjectId: validSubjectId,
          title: "Q5",
          orderIndex: 5,
          createdAt: "2026-08-01",
          updatedAt: "2026-08-01",
          status: "REVIEW",
          needsReview: true,
          attempts: [],
        },
        {
          id: "e6",
          subjectId: validSubjectId,
          title: "Q6",
          orderIndex: 6,
          createdAt: "2026-08-01",
          updatedAt: "2026-08-01",
          status: "PENDING",
          needsReview: false,
          attempts: [],
        },
      ];

      const progress = calculateExerciseSetProgress(dummyExercises);
      expect(progress.total).toBe(6);
      expect(progress.resolvedCount).toBe(2);
      expect(progress.partialCount).toBe(1);
      expect(progress.wrongCount).toBe(1);
      expect(progress.reviewCount).toBe(1);
      expect(progress.pendingCount).toBe(1);
      expect(progress.triedCount).toBe(4);
      // 2 / 6 = 33%
      expect(progress.progressPercentage).toBe(33);
      // 2 / 4 tried = 50%
      expect(progress.successRate).toBe(50);
    });
  });

  describe("Domain: compareExercisesNatural", () => {
    it("should sort exercises by referenceNumber naturally", () => {
      const ex1 = { id: "1", subjectId: "s", title: "Q2", referenceNumber: "Q2", status: "PENDING" as const, needsReview: false };
      const ex2 = { id: "2", subjectId: "s", title: "Q10", referenceNumber: "Q10", status: "PENDING" as const, needsReview: false };
      const ex3 = { id: "3", subjectId: "s", title: "Q1", referenceNumber: "Q1", status: "PENDING" as const, needsReview: false };

      const list = [ex1, ex2, ex3].sort(compareExercisesNatural);
      expect(list.map((e) => e.referenceNumber)).toEqual(["Q1", "Q2", "Q10"]);
    });

    it("should fall back to title when referenceNumber is not present", () => {
      const ex1 = { id: "1", subjectId: "s", title: "Exercício 10", status: "PENDING" as const, needsReview: false };
      const ex2 = { id: "2", subjectId: "s", title: "Exercício 2", status: "PENDING" as const, needsReview: false };
      const ex3 = { id: "3", subjectId: "s", title: "Exercício 1", status: "PENDING" as const, needsReview: false };

      const list = [ex1, ex2, ex3].sort(compareExercisesNatural);
      expect(list.map((e) => e.title)).toEqual([
        "Exercício 1",
        "Exercício 2",
        "Exercício 10",
      ]);
    });
  });
});
