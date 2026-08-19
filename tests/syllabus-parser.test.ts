import { describe, expect, it } from "vitest";
import { parseSyllabusText } from "@/domain/topics/syllabus-parser";

describe("Domain: Syllabus Parser", () => {
  it("should extract topics with numbered lists", () => {
    const raw = `
      Ementa
      1. Introdução à Mecânica dos Fluidos
      2. Estática dos Fluidos
      3. Equações Fundamentais de Conservação
      4. Escoamento Incompressível em Tubulações
    `;

    const topics = parseSyllabusText(raw);
    expect(topics).toEqual([
      "Introdução à Mecânica dos Fluidos",
      "Estática dos Fluidos",
      "Equações Fundamentais de Conservação",
      "Escoamento Incompressível em Tubulações",
    ]);
  });

  it("should extract topics with sub-numbering and bullets", () => {
    const raw = `
      Conteúdo Programático:
      1.1 - Balanço Microscópico de Massa
      1.2 - Balanço de Quantidade de Movimento
      • Condução Térmica Unidimensional
      • Convecção Forçada e Natural
      - Radiação Térmica
    `;

    const topics = parseSyllabusText(raw);
    expect(topics).toEqual([
      "Balanço Microscópico de Massa",
      "Balanço de Quantidade de Movimento",
      "Condução Térmica Unidimensional",
      "Convecção Forçada e Natural",
      "Radiação Térmica",
    ]);
  });

  it("should handle Unidade / Módulo / Capítulo prefixes", () => {
    const raw = `
      Unidade I: Fundamentos de Fenômenos de Transporte
      Unidade II - Mecanismos de Transferência de Calor
      Módulo 3: Transferência de Massa
    `;

    const topics = parseSyllabusText(raw);
    expect(topics).toEqual([
      "Fundamentos de Fenômenos de Transporte",
      "Mecanismos de Transferência de Calor",
      "Transferência de Massa",
    ]);
  });

  it("should filter out administrative headers and bibliografia", () => {
    const raw = `
      UNIVERSIDADE FEDERAL
      Departamento de Engenharia Química
      Professor: Dr. Carlos Silva
      Carga Horária: 60h
      Conteúdo Programático:
      1. Propriedades dos Fluidos
      2. Viscosidade e Lei de Newton
      Bibliografia Básica:
      FOX, R. W. Introdução à Mecânica dos Fluidos.
    `;

    const topics = parseSyllabusText(raw);
    expect(topics).toEqual([
      "Propriedades dos Fluidos",
      "Viscosidade e Lei de Newton",
      "FOX, R. W. Introdução à Mecânica dos Fluidos.",
    ]);
  });

  it("should deduplicate identical topics and handle empty input", () => {
    expect(parseSyllabusText("")).toEqual([]);

    const duplicateRaw = `
      1. Limites e Continuidade
      - Limites e Continuidade
      2. Derivadas
    `;
    const topics = parseSyllabusText(duplicateRaw);
    expect(topics).toEqual(["Limites e Continuidade", "Derivadas"]);
  });
});
