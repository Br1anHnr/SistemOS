import { describe, expect, it } from "vitest";
import {
  createPdfAnnotationSchema,
  updatePdfAnnotationSchema,
  pdfAnnotationTypeSchema,
} from "@/validations";

describe("Domain & Validations: PDF Annotations (Fase B1)", () => {
  const validUUID = "550e8400-e29b-41d4-a716-446655440000";
  const validMatUUID = "660e8400-e29b-41d4-a716-446655440000";

  it("should validate all 5 allowed annotation types", () => {
    expect(pdfAnnotationTypeSchema.parse("PEN")).toBe("PEN");
    expect(pdfAnnotationTypeSchema.parse("HIGHLIGHT")).toBe("HIGHLIGHT");
    expect(pdfAnnotationTypeSchema.parse("ARROW")).toBe("ARROW");
    expect(pdfAnnotationTypeSchema.parse("TEXT")).toBe("TEXT");
    expect(pdfAnnotationTypeSchema.parse("RECTANGLE")).toBe("RECTANGLE");
    expect(() => pdfAnnotationTypeSchema.parse("INVALID")).toThrow();
  });

  it("should validate correct PEN annotation with normalized points", () => {
    const valid = {
      topicId: validUUID,
      materialId: validMatUUID,
      pageNumber: 3,
      type: "PEN",
      data: {
        points: [
          { x: 0.12, y: 0.34 },
          { x: 0.15, y: 0.38 },
        ],
        color: "#eab308",
        strokeWidth: 4,
      },
    };

    const result = createPdfAnnotationSchema.parse(valid);
    expect(result.topicId).toBe(validUUID);
    expect(result.pageNumber).toBe(3);
    expect(result.type).toBe("PEN");
    expect(result.data.points.length).toBe(2);
  });

  it("should validate correct ARROW annotation with normalized coordinates", () => {
    const valid = {
      topicId: validUUID,
      pageNumber: 1,
      type: "ARROW",
      data: {
        startX: 0.2,
        startY: 0.3,
        endX: 0.45,
        endY: 0.6,
        color: "#ef4444",
        strokeWidth: 3,
      },
    };

    const result = createPdfAnnotationSchema.parse(valid);
    expect(result.type).toBe("ARROW");
    expect(result.data.startX).toBe(0.2);
    expect(result.data.endX).toBe(0.45);
  });

  it("should validate correct RECTANGLE annotation", () => {
    const valid = {
      topicId: validUUID,
      pageNumber: 5,
      type: "RECTANGLE",
      data: {
        x: 0.1,
        y: 0.2,
        width: 0.4,
        height: 0.25,
        color: "#3b82f6",
        strokeWidth: 2,
        fillColor: "rgba(59, 130, 246, 0.15)",
      },
    };

    const result = createPdfAnnotationSchema.parse(valid);
    expect(result.type).toBe("RECTANGLE");
    expect(result.data.width).toBe(0.4);
  });

  it("should validate correct TEXT annotation", () => {
    const valid = {
      topicId: validUUID,
      pageNumber: 2,
      type: "TEXT",
      data: {
        x: 0.5,
        y: 0.8,
        text: "Revisar equação de Bernoulli",
        color: "#ffffff",
        fontSize: 14,
      },
    };

    const result = createPdfAnnotationSchema.parse(valid);
    expect(result.type).toBe("TEXT");
    expect(result.data.text).toBe("Revisar equação de Bernoulli");
  });

  it("should reject annotation creation with invalid pageNumber", () => {
    expect(() =>
      createPdfAnnotationSchema.parse({
        topicId: validUUID,
        pageNumber: 0,
        type: "PEN",
        data: {},
      })
    ).toThrow();
  });

  it("should allow partial annotation updates", () => {
    const update = updatePdfAnnotationSchema.parse({
      data: {
        text: "Texto atualizado",
      },
    });

    expect(update.data?.text).toBe("Texto atualizado");
  });
});
