import { describe, expect, it } from "vitest";
import {
  studyBoardItemTypeSchema,
  createStudyBoardItemSchema,
  updateStudyBoardItemSchema,
  addPdfRegionToBoardSchema,
} from "@/validations";

describe("Domain & Validations: Study Boards (Lousa de Estudo — Fase C1)", () => {
  const validBoardId = "550e8400-e29b-41d4-a716-446655440000";
  const validTopicId = "660e8400-e29b-41d4-a716-446655440000";
  const validMaterialId = "770e8400-e29b-41d4-a716-446655440000";
  const validAnchorId = "880e8400-e29b-41d4-a716-446655440000";

  it("should validate all 5 allowed study board item types", () => {
    expect(studyBoardItemTypeSchema.parse("TEXT")).toBe("TEXT");
    expect(studyBoardItemTypeSchema.parse("NOTE")).toBe("NOTE");
    expect(studyBoardItemTypeSchema.parse("DRAWING")).toBe("DRAWING");
    expect(studyBoardItemTypeSchema.parse("ARROW")).toBe("ARROW");
    expect(studyBoardItemTypeSchema.parse("PDF_REGION")).toBe("PDF_REGION");
    expect(() => studyBoardItemTypeSchema.parse("INVALID_TYPE")).toThrow();
  });

  it("should validate createStudyBoardItemSchema for a TEXT item", () => {
    const valid = {
      boardId: validBoardId,
      type: "TEXT",
      data: { text: "Equação da Continuidade" },
      x: 100,
      y: 150,
      width: 250,
      height: 60,
      zIndex: 1,
    };

    const result = createStudyBoardItemSchema.parse(valid);
    expect(result.boardId).toBe(validBoardId);
    expect(result.type).toBe("TEXT");
    expect(result.data.text).toBe("Equação da Continuidade");
    expect(result.x).toBe(100);
    expect(result.y).toBe(150);
  });

  it("should validate createStudyBoardItemSchema for a NOTE item with defaults", () => {
    const valid = {
      boardId: validBoardId,
      type: "NOTE",
      data: {
        title: "Hipótese de Fluido Ideal",
        content: "Sem viscosidade, incompressível e escoamento irrotacional.",
      },
    };

    const result = createStudyBoardItemSchema.parse(valid);
    expect(result.type).toBe("NOTE");
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(result.width).toBe(200);
    expect(result.height).toBe(150);
    expect(result.zIndex).toBe(0);
  });

  it("should validate createStudyBoardItemSchema for a DRAWING stroke", () => {
    const valid = {
      boardId: validBoardId,
      type: "DRAWING",
      x: 50,
      y: 50,
      width: 200,
      height: 100,
      data: {
        points: [
          { x: 50, y: 50 },
          { x: 80, y: 90 },
          { x: 120, y: 150 },
        ],
        color: "#a855f7",
        strokeWidth: 4,
      },
    };

    const result = createStudyBoardItemSchema.parse(valid);
    expect(result.type).toBe("DRAWING");
    expect(result.data.points.length).toBe(3);
    expect(result.data.color).toBe("#a855f7");
  });

  it("should validate createStudyBoardItemSchema for an ARROW connection", () => {
    const valid = {
      boardId: validBoardId,
      type: "ARROW",
      data: {
        startX: 100,
        startY: 100,
        endX: 300,
        endY: 250,
        color: "#eab308",
      },
    };

    const result = createStudyBoardItemSchema.parse(valid);
    expect(result.type).toBe("ARROW");
    expect(result.data.startX).toBe(100);
    expect(result.data.endX).toBe(300);
  });

  it("should validate addPdfRegionToBoardSchema for region transfer from PDF", () => {
    const valid = {
      topicId: validTopicId,
      materialId: validMaterialId,
      pageNumber: 5,
      anchorId: validAnchorId,
      bounding: {
        x: 0.1,
        y: 0.2,
        width: 0.4,
        height: 0.3,
      },
      title: "Gráfico de Perfil de Velocidades",
    };

    const result = addPdfRegionToBoardSchema.parse(valid);
    expect(result.topicId).toBe(validTopicId);
    expect(result.materialId).toBe(validMaterialId);
    expect(result.pageNumber).toBe(5);
    expect(result.anchorId).toBe(validAnchorId);
    expect(result.bounding.x).toBe(0.1);
    expect(result.title).toBe("Gráfico de Perfil de Velocidades");
  });

  it("should validate partial updates with updateStudyBoardItemSchema", () => {
    const partial = {
      x: 350,
      y: 420,
      zIndex: 5,
    };

    const result = updateStudyBoardItemSchema.parse(partial);
    expect(result.x).toBe(350);
    expect(result.y).toBe(420);
    expect(result.zIndex).toBe(5);
    expect(result.data).toBeUndefined();
  });

  it("should reject addPdfRegionToBoardSchema with invalid page number", () => {
    expect(() =>
      addPdfRegionToBoardSchema.parse({
        topicId: validTopicId,
        pageNumber: 0,
        bounding: { x: 0, y: 0, width: 0.1, height: 0.1 },
      })
    ).toThrow();
  });
});
