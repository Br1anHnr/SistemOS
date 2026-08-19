import { describe, expect, it } from "vitest";
import {
  parseSyllabusText,
  isBibliographicCitation,
} from "@/domain/topics/syllabus-parser";

describe("Domain: Syllabus Parser & Anti-Noise Filters", () => {
  it("should correctly identify bibliographic citations", () => {
    expect(
      isBibliographicCitation(
        "FOX, R. W.; MCDONALD, A. T.; PRITCHARD, P. J. Introdução à Mecânica dos Fluidos."
      )
    ).toBe(true);
    expect(
      isBibliographicCitation(
        "BERGMAN, T. L.; LAVINE, A. S. Incropera: Fundamentos de Transferência de Calor e Massa."
      )
    ).toBe(true);
    expect(isBibliographicCitation("LTC, 2019.")).toBe(true);
    expect(isBibliographicCitation("Rio de Janeiro: LTC, 2019.")).toBe(true);
    expect(
      isBibliographicCitation("Transferência de Calor por Condução")
    ).toBe(false);
  });

  it("should extract only real programmatic topics from introductory slides with noisy metadata", () => {
    const rawSlideText = `
      UNESP - Campus de Guaratinguetá
      FENÔMENOS DE TRANSPORTE
      Docente: Prof. Dr. Nestor Proenza
      mail: nestor.proenza@unesp.br
      Sala: 311E

      Conteúdo Programático:
      1. Introdução e Conceitos Fundamentais
      2. Estática dos Fluidos e Manometria
      3. Conservação de Massa e Energia
      4. Escoamento Interno Viscoso em Tubos
      5. Transferência de Calor por Condução
      6. Convecção Térmica Natural e Forçada
      7. Radiação Térmica
      8. Difusão Mássica Unidimensional

      Critérios de Avaliação:
      P1: 08/04/2026
      P2: 10/06/2026
      Média Final: (P1 + P2)/2

      Bibliografia Básica:
      FOX, R. W.; MCDONALD, A. T.; PRITCHARD, P. J. Introdução à Mecânica dos Fluidos. LTC, 2019.
      BERGMAN, T. L.; LAVINE, A. S. Incropera: Fundamentos de Transferência de Calor e Massa. LTC, 2019.
      LTC, 2019.
    `;

    const topics = parseSyllabusText(rawSlideText, {
      subjectName: "Fenômenos de Transporte",
      subjectCode: "QE003FT 311E",
    });

    expect(topics).toEqual([
      "Introdução e Conceitos Fundamentais",
      "Estática dos Fluidos e Manometria",
      "Conservação de Massa e Energia",
      "Escoamento Interno Viscoso em Tubos",
      "Transferência de Calor por Condução",
      "Convecção Térmica Natural e Forçada",
      "Radiação Térmica",
      "Difusão Mássica Unidimensional",
    ]);
  });

  it("should extract topics when no explicit section marker exists but discard noise", () => {
    const rawText = `
      mail: professor@universidade.br
      1. Introdução à Mecânica dos Fluidos
      2. Estática dos Fluidos
      3. Equações Fundamentais de Conservação
      4. Escoamento Incompressível em Tubulações
      LTC, 2019.
    `;

    const topics = parseSyllabusText(rawText);
    expect(topics).toEqual([
      "Introdução à Mecânica dos Fluidos",
      "Estática dos Fluidos",
      "Equações Fundamentais de Conservação",
      "Escoamento Incompressível em Tubulações",
    ]);
  });

  it("should handle sub-numbering and bullets cleanly", () => {
    const raw = `
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
});
