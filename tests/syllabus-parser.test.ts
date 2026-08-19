import { describe, expect, it } from "vitest";
import {
  parseSyllabusText,
  parseLectureSlide,
  isBibliographicCitation,
  isInvalidFragmentOrSentence,
  deriveModuleTitleFromFileName,
} from "@/domain/topics/syllabus-parser";

describe("Domain: Syllabus & Slide Parser Anti-Fragment Filters", () => {
  it("should correctly identify and reject broken phrase fragments and conversational body lines", () => {
    expect(isInvalidFragmentOrSentence("A Mecânica dos")).toBe(true); // ends with preposition "dos"
    expect(isInvalidFragmentOrSentence("Fluidos trata do")).toBe(true); // ends with "do" + has "trata do"
    expect(isInvalidFragmentOrSentence("comportamento")).toBe(true); // starts with lowercase
    expect(isInvalidFragmentOrSentence("dos fluidos em")).toBe(true); // starts with lowercase & ends with "em"
    expect(isInvalidFragmentOrSentence("quando submetidos a uma tensão")).toBe(true); // starts with lowercase

    // Valid conceptual topic titles should NOT be rejected
    expect(
      isInvalidFragmentOrSentence("Características e Propriedades dos Fluidos")
    ).toBe(false);
    expect(
      isInvalidFragmentOrSentence("Viscosidade Dinâmica e Cinemática")
    ).toBe(false);
    expect(
      isInvalidFragmentOrSentence("Tensão de Cisalhamento e Lei de Newton")
    ).toBe(false);
  });

  it("should extract only real slide titles from noisy AULA 2 slide text", () => {
    const rawSlidePresentationText = `
      UNESP - Campus de Guaratinguetá
      FENÔMENOS DE TRANSPORTE
      Docente: Prof. Dr. Nestor Proenza
      mail: nestor.proenza@unesp.br

      AULA 2 - Capítulo 2: Conceitos Fundamentais

      A Mecânica dos
      Fluidos trata do
      comportamento
      dos fluidos em
      repouso ou em movimento.

      1. Características e Propriedades dos Fluidos
      A densidade é definida como a massa por unidade de volume.
      Temos que rho = m / V.

      2. Viscosidade Dinâmica e Cinemática
      A viscosidade representa a resistência ao escoamento.
      tau = mu * (du/dy)

      3. Tensão Superficial e Capilaridade
      Podemos observar este fenômeno em tubos finos.

      4. Pressão de Vapor e Cavitação
      Conforme visto no gráfico da figura 2.3.

      Bibliografia:
      FOX, R. W.; MCDONALD, A. T. LTC, 2019.
    `;

    const extracted = parseSyllabusText(rawSlidePresentationText, {
      subjectName: "Fenômenos de Transporte",
      fileName: "AULA 2- Capitulo 2 Conceitos Fundamentais.pdf",
    });

    expect(extracted).toEqual([
      "Características e Propriedades dos Fluidos",
      "Viscosidade Dinâmica e Cinemática",
      "Tensão Superficial e Capilaridade",
      "Pressão de Vapor e Cavitação",
    ]);
  });

  it("should derive clean module titles from slide file names", () => {
    expect(
      deriveModuleTitleFromFileName(
        "AULA 2- Capitulo 2 Conceitos Fundamentais e Propriedades FT 2026.pdf"
      )
    ).toBe("Capítulo 2: Conceitos Fundamentais e Propriedades");
  });

  it("should extract structured lecture module and subtopics", () => {
    const rawText = `
      1. Introdução à Mecânica dos Fluidos
      2. Estática dos Fluidos
      3. Equações Fundamentais de Conservação
    `;
    const result = parseLectureSlide(rawText, {
      fileName: "AULA 1 - Introducao e Estatica.pdf",
    });

    expect(result.moduleTitle).toBe("Introducao e Estatica");
    expect(result.subtopics).toEqual([
      "Introdução à Mecânica dos Fluidos",
      "Estática dos Fluidos",
      "Equações Fundamentais de Conservação",
    ]);
  });
});
