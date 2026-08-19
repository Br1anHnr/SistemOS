import { describe, expect, it } from "vitest";
import {
  createPdfNoteAnchorSchema,
  createAnchoredNoteSchema,
  pdfAnchorTypeSchema,
  topicNoteTypeSchema,
} from "@/validations";

describe("Domain & Validations: PDF Note Anchors (Pins & Regions - Fase B2)", () => {
  const validTopicId = "550e8400-e29b-41d4-a716-446655440000";
  const validNoteId = "660e8400-e29b-41d4-a716-446655440000";
  const validMatId = "770e8400-e29b-41d4-a716-446655440000";

  it("should validate all allowed anchor types", () => {
    expect(pdfAnchorTypeSchema.parse("POINT")).toBe("POINT");
    expect(pdfAnchorTypeSchema.parse("REGION")).toBe("REGION");
    expect(() => pdfAnchorTypeSchema.parse("INVALID")).toThrow();
  });

  it("should validate all 5 note types including EXAM", () => {
    expect(topicNoteTypeSchema.parse("NOTE")).toBe("NOTE");
    expect(topicNoteTypeSchema.parse("IMPORTANT")).toBe("IMPORTANT");
    expect(topicNoteTypeSchema.parse("QUESTION")).toBe("QUESTION");
    expect(topicNoteTypeSchema.parse("FORMULA")).toBe("FORMULA");
    expect(topicNoteTypeSchema.parse("EXAM")).toBe("EXAM");
  });

  it("should validate correct POINT anchor creation", () => {
    const valid = {
      noteId: validNoteId,
      topicId: validTopicId,
      materialId: validMatId,
      pageNumber: 4,
      anchorType: "POINT",
      data: {
        x: 0.42,
        y: 0.31,
      },
    };

    const result = createPdfNoteAnchorSchema.parse(valid);
    expect(result.noteId).toBe(validNoteId);
    expect(result.anchorType).toBe("POINT");
    expect(result.data.x).toBe(0.42);
    expect(result.data.y).toBe(0.31);
  });

  it("should validate correct REGION anchor creation", () => {
    const valid = {
      noteId: validNoteId,
      topicId: validTopicId,
      materialId: validMatId,
      pageNumber: 7,
      anchorType: "REGION",
      data: {
        x: 0.15,
        y: 0.25,
        width: 0.6,
        height: 0.35,
      },
    };

    const result = createPdfNoteAnchorSchema.parse(valid);
    expect(result.anchorType).toBe("REGION");
    expect(result.data.width).toBe(0.6);
    expect(result.data.height).toBe(0.35);
  });

  it("should validate combined createAnchoredNoteSchema for atomic creation", () => {
    const validPointNote = {
      topicId: validTopicId,
      materialId: validMatId,
      pageNumber: 2,
      type: "QUESTION",
      content: "Qual é a hipótese adotada para o fluido incompressível?",
      anchorType: "POINT",
      anchorData: {
        x: 0.5,
        y: 0.6,
      },
    };

    const result = createAnchoredNoteSchema.parse(validPointNote);
    expect(result.type).toBe("QUESTION");
    expect(result.anchorType).toBe("POINT");
    expect(result.content).toBe("Qual é a hipótese adotada para o fluido incompressível?");
    expect(result.anchorData.x).toBe(0.5);
  });

  it("should validate combined createAnchoredNoteSchema for REGION formula", () => {
    const validRegionNote = {
      topicId: validTopicId,
      pageNumber: 3,
      type: "FORMULA",
      content: "Equação da Quantidade de Movimento Linear",
      anchorType: "REGION",
      anchorData: {
        x: 0.2,
        y: 0.4,
        width: 0.5,
        height: 0.2,
      },
    };

    const result = createAnchoredNoteSchema.parse(validRegionNote);
    expect(result.type).toBe("FORMULA");
    expect(result.anchorType).toBe("REGION");
    expect(result.anchorData.width).toBe(0.5);
  });

  it("should reject creation with non-positive pageNumber", () => {
    expect(() =>
      createAnchoredNoteSchema.parse({
        topicId: validTopicId,
        pageNumber: 0,
        type: "NOTE",
        content: "Conteudo",
        anchorData: { x: 0.1, y: 0.1 },
      })
    ).toThrow();
  });

  it("should reject creation with empty note content", () => {
    expect(() =>
      createAnchoredNoteSchema.parse({
        topicId: validTopicId,
        pageNumber: 1,
        type: "NOTE",
        content: "",
        anchorData: { x: 0.1, y: 0.1 },
      })
    ).toThrow();
  });
});
