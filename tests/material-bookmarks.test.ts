import { describe, expect, it } from "vitest";
import {
  createMaterialBookmarkSchema,
  updateMaterialBookmarkSchema,
  materialBookmarkTypeSchema,
} from "@/validations";

describe("Domain & Validations: Material Bookmarks", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";
  const validMatUUID = "660e8400-e29b-41d4-a716-446655440000";

  it("should validate all 4 allowed bookmark types", () => {
    expect(materialBookmarkTypeSchema.parse("BOOKMARK")).toBe("BOOKMARK");
    expect(materialBookmarkTypeSchema.parse("IMPORTANT")).toBe("IMPORTANT");
    expect(materialBookmarkTypeSchema.parse("EXAM")).toBe("EXAM");
    expect(materialBookmarkTypeSchema.parse("QUESTION")).toBe("QUESTION");
    expect(() => materialBookmarkTypeSchema.parse("INVALID_TYPE")).toThrow();
  });

  it("should validate correct bookmark creation", () => {
    const valid = {
      topicId: validUUID,
      materialId: validMatUUID,
      pageNumber: 32,
      title: "⭐ Equação Fundamental da Hidrostática",
      type: "EXAM",
    };

    const result = createMaterialBookmarkSchema.parse(valid);
    expect(result.pageNumber).toBe(32);
    expect(result.type).toBe("EXAM");
    expect(result.title).toBe("⭐ Equação Fundamental da Hidrostática");
  });

  it("should reject bookmark creation with non-positive pageNumber or empty title", () => {
    expect(() =>
      createMaterialBookmarkSchema.parse({
        topicId: validUUID,
        materialId: validMatUUID,
        pageNumber: 0,
        title: "Título",
      })
    ).toThrow();

    expect(() =>
      createMaterialBookmarkSchema.parse({
        topicId: validUUID,
        materialId: validMatUUID,
        pageNumber: 5,
        title: "",
      })
    ).toThrow();
  });

  it("should allow partial bookmark updates", () => {
    const update = updateMaterialBookmarkSchema.parse({
      pageNumber: 41,
      title: "Rever demonstração",
      type: "QUESTION",
    });

    expect(update.pageNumber).toBe(41);
    expect(update.type).toBe("QUESTION");
  });
});
