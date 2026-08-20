import { describe, it, expect } from "vitest";
import {
  createExerciseSourceRegionSchema,
  createExerciseSchema,
} from "@/validations";

describe("Exercise Source Regions Validation", () => {
  const validExerciseId = "123e4567-e89b-12d3-a456-426614174000";
  const validSubjectId = "223e4567-e89b-12d3-a456-426614174000";
  const validMaterialId = "323e4567-e89b-12d3-a456-426614174000";

  it("validates valid source region coordinates", () => {
    const validData = {
      exerciseId: validExerciseId,
      materialId: validMaterialId,
      pageNumber: 2,
      x: 0.15,
      y: 0.25,
      width: 0.7,
      height: 0.3,
      orderIndex: 0,
    };

    const parsed = createExerciseSourceRegionSchema.parse(validData);
    expect(parsed.exerciseId).toBe(validExerciseId);
    expect(parsed.pageNumber).toBe(2);
    expect(parsed.x).toBe(0.15);
    expect(parsed.width).toBe(0.7);
  });

  it("rejects coordinates outside 0..1 range", () => {
    const invalidData = {
      exerciseId: validExerciseId,
      pageNumber: 1,
      x: -0.1, // invalid negative
      y: 0.2,
      width: 0.5,
      height: 0.5,
    };

    expect(() => createExerciseSourceRegionSchema.parse(invalidData)).toThrow();
  });

  it("rejects pageNumber less than 1", () => {
    const invalidData = {
      exerciseId: validExerciseId,
      pageNumber: 0, // invalid page
      x: 0.1,
      y: 0.2,
      width: 0.5,
      height: 0.5,
    };

    expect(() => createExerciseSourceRegionSchema.parse(invalidData)).toThrow();
  });

  it("allows creating exercise with nested sourceRegions", () => {
    const exerciseWithRegions = {
      subjectId: validSubjectId,
      title: "Questão 01",
      referenceNumber: "Q01",
      sourceRegions: [
        {
          pageNumber: 1,
          x: 0.1,
          y: 0.1,
          width: 0.8,
          height: 0.2,
          orderIndex: 0,
        },
        {
          pageNumber: 2,
          x: 0.1,
          y: 0.3,
          width: 0.8,
          height: 0.4,
          orderIndex: 1,
        },
      ],
    };

    const parsed = createExerciseSchema.parse(exerciseWithRegions);
    expect(parsed.title).toBe("Questão 01");
    expect(parsed.sourceRegions).toHaveLength(2);
    expect(parsed.sourceRegions?.[1].pageNumber).toBe(2);
  });
});
