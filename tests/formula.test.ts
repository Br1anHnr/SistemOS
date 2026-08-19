import { describe, expect, it } from "vitest";
import { formatGradingFormula } from "@/domain/grades";

describe("Grading Formula Preview Formatter", () => {
  it("should format simple equal weight average (P1, P2)", () => {
    const components = [
      { name: "P1", weight: 1 },
      { name: "P2", weight: 1 },
    ];
    expect(formatGradingFormula(components)).toBe("(P1 + P2) / 2");
  });

  it("should format weighted average (P1 weight 4, P2 weight 6)", () => {
    const components = [
      { name: "P1", weight: 4 },
      { name: "P2", weight: 6 },
    ];
    expect(formatGradingFormula(components)).toBe("(P1 × 4 + P2 × 6) / 10");
  });

  it("should format three components with equal weights (P1, P2, P3)", () => {
    const components = [
      { name: "P1", weight: 1 },
      { name: "P2", weight: 1 },
      { name: "P3", weight: 1 },
    ];
    expect(formatGradingFormula(components)).toBe("(P1 + P2 + P3) / 3");
  });

  it("should format single component", () => {
    const components = [{ name: "P1", weight: 1 }];
    expect(formatGradingFormula(components)).toBe("P1");
  });

  it("should format complex mixed weights", () => {
    const components = [
      { name: "P1", weight: 3 },
      { name: "P2", weight: 3 },
      { name: "Trabalho", weight: 4 },
    ];
    expect(formatGradingFormula(components)).toBe(
      "(P1 × 3 + P2 × 3 + Trabalho × 4) / 10"
    );
  });
});
