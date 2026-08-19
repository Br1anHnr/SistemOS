import { describe, expect, it } from "vitest";
import {
  createTopicNoteSchema,
  updateTopicNoteSchema,
  topicNoteTypeSchema,
} from "@/validations";

describe("Domain & Validations: Topic Notes", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";

  it("should validate all 4 allowed note types", () => {
    expect(topicNoteTypeSchema.parse("NOTE")).toBe("NOTE");
    expect(topicNoteTypeSchema.parse("IMPORTANT")).toBe("IMPORTANT");
    expect(topicNoteTypeSchema.parse("QUESTION")).toBe("QUESTION");
    expect(topicNoteTypeSchema.parse("FORMULA")).toBe("FORMULA");
    expect(() => topicNoteTypeSchema.parse("INVALID_TYPE")).toThrow();
  });

  it("should validate valid note creation with pageNumber", () => {
    const valid = {
      topicId: validUUID,
      type: "QUESTION",
      content: "Não entendi de onde vem a simplificação da equação de Navier-Stokes.",
      pageNumber: 17,
    };

    const result = createTopicNoteSchema.parse(valid);
    expect(result.topicId).toBe(validUUID);
    expect(result.type).toBe("QUESTION");
    expect(result.pageNumber).toBe(17);
  });

  it("should allow note creation without pageNumber", () => {
    const valid = {
      topicId: validUUID,
      content: "Revisar conceitos fundamentais antes da prova.",
    };

    const result = createTopicNoteSchema.parse(valid);
    expect(result.type).toBe("NOTE"); // default
    expect(result.pageNumber).toBeUndefined();
  });

  it("should reject empty content or invalid page numbers", () => {
    expect(() =>
      createTopicNoteSchema.parse({
        topicId: validUUID,
        content: "",
      })
    ).toThrow();

    expect(() =>
      createTopicNoteSchema.parse({
        topicId: validUUID,
        content: "Valido",
        pageNumber: -5,
      })
    ).toThrow();
  });

  it("should allow partial updates", () => {
    const update = updateTopicNoteSchema.parse({
      content: "Novo conteúdo atualizado",
      type: "FORMULA",
    });

    expect(update.content).toBe("Novo conteúdo atualizado");
    expect(update.type).toBe("FORMULA");
  });
});
