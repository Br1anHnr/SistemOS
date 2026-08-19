/**
 * Formats a preview formula string from a list of grade components and their weights.
 *
 * Examples:
 * - Equal weights (1, 1): "(P1 + P2) / 2"
 * - Weighted (4, 6): "(P1 × 4 + P2 × 6) / 10"
 * - Single component (1): "P1"
 */
export interface FormulaComponent {
  name: string;
  weight: number;
}

export function formatGradingFormula(components: FormulaComponent[]): string {
  if (components.length === 0) return "Nenhuma fórmula definida";

  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight <= 0) return "Pesos inválidos";

  // Check if all weights are identical
  const firstWeight = components[0].weight;
  const allEqual = components.every((c) => c.weight === firstWeight);

  if (components.length === 1) {
    return components[0].name;
  }

  if (allEqual && firstWeight === 1) {
    const parts = components.map((c) => c.name).join(" + ");
    return `(${parts}) / ${components.length}`;
  }

  if (allEqual) {
    const parts = components.map((c) => c.name).join(" + ");
    return `(${parts}) / ${components.length}`;
  }

  const parts = components
    .map((c) => (c.weight === 1 ? c.name : `${c.name} × ${c.weight}`))
    .join(" + ");

  return `(${parts}) / ${totalWeight}`;
}
