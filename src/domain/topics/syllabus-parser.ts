/**
 * Pure domain parser for extracting topics from syllabus texts, slide presentations, and academic documents.
 * Features grammatical filtering, phrase fragment elimination, and slide-deck module extraction.
 */

export interface ParserOptions {
  subjectName?: string | null;
  subjectCode?: string | null;
  fileName?: string | null;
  mode?: "AUTO" | "LECTURE_SLIDE" | "SYLLABUS";
}

export interface ExtractedLectureModule {
  moduleTitle: string;
  subtopics: string[];
}

const SECTION_START_REGEX =
  /(conte[úu]do\s+program[áa]tico|programa\s+da\s+disciplina|plano\s+de\s+ensino|ementa|unidades?\s+tem[áa]ticas?|t[óo]picos?\s+(abordados?|programados?)|roteiro\s+do\s+curso|cronograma(\s+de\s+aulas?)?|sum[áa]rio(\s+das?\s+aulas?)?|objetivos?\s+da\s+aula)/i;

const SECTION_END_REGEX =
  /(bibliografia(\s+b[áa]sica|\s+complementar)?|refer[êe]ncias(\s+bibliogr[áa]ficas)?|crit[ée]rios?\s+de\s+avalia[çc][ãa]o|sistema\s+de\s+avalia[çc][ãa]o|avalia[çc][ãa]o|metodologia(\s+de\s+ensino)?|datas?\s+das?\s+provas?|atendimento\s+ao\s+aluno|regras?\s+do\s+curso|disposi[çc][õo]es\s+gerais)/i;

const PUBLISHERS_AND_CITATIONS =
  /\b(ltc|pearson|mcgraw[\s\-]hill|editora|ed\.|vol\.|volume|isbn|p[áa]g\.|pp\.|cap\.|livros?|blucher|bookman|cengage|saraiva|campus|elsevier|springer|wiley)\b/i;

const CONTACT_AND_WEB_REGEX =
  /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|mail:|email:|e-mail:|contato:|whatsapp:|http:\/\/|https:\/\/|www\.)/i;

const ADMIN_METADATA_REGEX =
  /^(universidade|faculdade|instituto|departamento|disciplina|docente|professor(a)?|campus|turma|sala|hor[áa]rio|carga\s+hor[áa]ria|per[íi]odo|semestre|ano\s+letivo|c[óo]digo|cr[ée]ditos?|unesp|usp|unicamp|uf\w+)\b/i;

// Prepositions, articles, conjunctions that cannot end a valid topic heading
// Must match specifically at the very end of the line: e.g. "A Mecânica dos", "Fluidos trata do"
const INVALID_TRAILING_WORDS =
  /(?:^|\s)(de|do|da|dos|das|em|no|na|nos|nas|com|para|por|a|o|os|as|e|ou|que|se|um|uma|uns|umas|ao|aos|à|às|num|numa|sob|sobre|entre|sem)$/i;

// Explanatory verbs and phrases in slide body paragraphs
const EXPLANATORY_PHRASES =
  /\b(trata\s+do|trata\s+da|tratam\s+de|consiste\s+em|definido\s+como|definida\s+como|podemos\s+ver|podemos\s+observar|observa-se|nota-se|mostra\s+que|sendo\s+que|isto\s+[ée]|ou\s+seja|conforme\s+visto|segundo\s+o|de\s+acordo\s+com|figura\s+\d|tabela\s+\d|gr[áa]fico\s+\d|slide\s+\d|exemplo\s+\d|exerc[íi]cio)\b/i;

/**
 * Checks if a string looks like an ABNT bibliographic citation.
 */
export function isBibliographicCitation(line: string): boolean {
  const trimmed = line.trim();

  // Pattern: "LASTNAME, F. N." (Author in uppercase followed by comma and initials)
  if (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{2,},\s+[A-Z]\./.test(trimmed)) {
    return true;
  }

  // Author names separated by semicolon: e.g. "FOX, R. W.; MCDONALD, A. T."
  if (/[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,},\s+[A-Z]\.\s*[A-Z]?\.;/i.test(trimmed)) {
    return true;
  }

  // Publisher / ISBN / Page citations
  if (PUBLISHERS_AND_CITATIONS.test(trimmed)) {
    if (/\b(19\d\d|20\d\d)\b/.test(trimmed)) {
      return true;
    }
  }

  // Isolated city/publisher/year line: e.g. "Rio de Janeiro: LTC, 2019."
  if (/^[A-Za-z\s,;:]+\b(19\d\d|20\d\d)\.?$/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Validates if a line is a genuine conceptual topic/heading vs a fragmented explanation phrase.
 */
export function isInvalidFragmentOrSentence(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 4) return true;

  // 1. Rejects lines starting with a lowercase character (e.g. "comportamento", "dos fluidos em")
  const firstChar = trimmed.charAt(0);
  if (firstChar === firstChar.toLowerCase() && firstChar !== firstChar.toUpperCase()) {
    return true;
  }

  // 2. Rejects lines ending with dangling prepositions/conjunctions (e.g. "A Mecânica dos", "Fluidos trata do")
  if (INVALID_TRAILING_WORDS.test(trimmed)) {
    return true;
  }

  // 3. Rejects explanatory conversational phrases and verbs
  if (EXPLANATORY_PHRASES.test(trimmed)) {
    return true;
  }

  // 4. Rejects lines that end in full stops of long explanatory sentences (unless short acronym)
  if (trimmed.endsWith(".") && trimmed.length > 45 && !trimmed.endsWith("etc.")) {
    return true;
  }

  // 5. Rejects lines with mathematical equations or standalone variables
  if (/(=|<|>|\+|\-|\*|\/|\^|\\tau|\\mu|\\rho|\\Delta)/.test(trimmed) && !trimmed.includes(" - ")) {
    return true;
  }

  // 6. Rejects lines that are pure numbers or punctuation
  if (/^[0-9\s\.\,\;\:\-\–\—\/\(\)\%\$\#\@\!]+$/.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Derives a clean module name from a lecture slide filename.
 * e.g. "AULA 2- Capitulo 2 Conceitos Fundamentais e Propriedades FT 2026.pdf"
 * -> "Capítulo 2: Conceitos Fundamentais e Propriedades"
 */
export function deriveModuleTitleFromFileName(fileName?: string | null): string {
  if (!fileName) return "Módulo de Aula";

  let clean = fileName.replace(/\.[^/.]+$/, ""); // strip extension
  clean = clean.replace(/_/g, " ");

  // If starts with "AULA X -" or "AULA X", extract chapter/title
  clean = clean.replace(/^aula\s*\d+[\s\-_:]*/i, "");
  clean = clean.replace(/\b(202\d|ft|fís|quim|eng|versao|v\d|final|prof\w*)\b/gi, "");
  clean = clean.replace(/\s{2,}/g, " ").trim();

  // If chapter formatting exists
  clean = clean.replace(/^(cap[íi]tulo\s*(\d+))[\s\-_:]*(.+)$/i, "Capítulo $2: $3");

  return clean.length > 3 ? clean : "Módulo de Conteúdos da Aula";
}

/**
 * Extracts clean programmatic slice if section markers exist.
 */
export function extractProgrammaticSlice(rawText: string): string {
  const lines = rawText.split(/\r?\n/);
  let startIndex = -1;
  let endIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (startIndex === -1 && SECTION_START_REGEX.test(line)) {
      startIndex = i;
    } else if (startIndex !== -1 && SECTION_END_REGEX.test(line)) {
      endIndex = i;
      break;
    }
  }

  if (startIndex !== -1) {
    const sliceEnd = endIndex !== -1 ? endIndex : lines.length;
    return lines.slice(startIndex, sliceEnd).join("\n");
  }

  return rawText;
}

/**
 * Parses slide presentations into a structured Lecture Module with subtopics.
 */
export function parseLectureSlide(
  rawText: string,
  options?: ParserOptions
): ExtractedLectureModule {
  const moduleTitle = deriveModuleTitleFromFileName(options?.fileName);
  const subtopics = parseSyllabusText(rawText, options);

  return {
    moduleTitle,
    subtopics,
  };
}

/**
 * Main parser function to extract valid topics from text or documents.
 */
export function parseSyllabusText(
  rawText: string,
  options?: ParserOptions
): string[] {
  if (!rawText || rawText.trim().length === 0) return [];

  const targetedText = extractProgrammaticSlice(rawText);
  const lines = targetedText.split(/\r?\n/);

  const result: string[] = [];
  const seen = new Set<string>();

  const normalizedSubjectName = options?.subjectName?.trim().toLowerCase();
  const normalizedSubjectCode = options?.subjectCode?.trim().toLowerCase();
  const derivedModuleTitle = deriveModuleTitleFromFileName(options?.fileName).toLowerCase();

  for (let line of lines) {
    line = line.trim();
    if (line.length === 0) continue;

    // 1. Filter contacts, emails, websites
    if (CONTACT_AND_WEB_REGEX.test(line)) continue;

    // 2. Filter section headers
    if (SECTION_START_REGEX.test(line) && line.length < 50) continue;
    if (SECTION_END_REGEX.test(line) && line.length < 50) continue;

    // 3. Filter administrative metadata
    if (ADMIN_METADATA_REGEX.test(line)) continue;

    // 4. Filter bibliographic citations
    if (isBibliographicCitation(line)) continue;

    // 5. Filter subject name/code headers
    const lineLower = line.toLowerCase();
    if (normalizedSubjectName && lineLower === normalizedSubjectName) continue;
    if (normalizedSubjectCode && lineLower === normalizedSubjectCode) continue;
    if (lineLower.startsWith("aula ") && lineLower.includes("capítulo")) continue;
    if (lineLower === derivedModuleTitle) continue;

    // 6. Filter grammar fragments, broken lines and slide body sentences
    if (isInvalidFragmentOrSentence(line)) continue;

    // Strip markdown formatting like ### or **
    line = line.replace(/^#{1,6}\s+/, "");
    line = line.replace(/^\*{1,2}(.*?)\*{1,2}$/, "$1");

    // Strip leading numbering, bullets, unit prefixes
    line = line.replace(
      /^(unidade|m[óo]dulo|cap[íi]tulo|tema|aula|se[çc][ãa]o)\s+([0-9IVXLCDMivxlcdm]+)\s*[:\-–—.]?\s*/i,
      ""
    );
    line = line.replace(
      /^([0-9]{1,3}(\.[0-9]{1,3})*|[IVXLCDMivxlcdm]+|[a-zA-Z])\s*[\)\.\-–—:]\s*/,
      ""
    );
    line = line.replace(/^[\-\*•–—►▪▫◦]\s*/, "");
    line = line.replace(/^\d+\s+/, "");

    line = line.trim();

    // Re-verify after stripping
    if (isInvalidFragmentOrSentence(line)) continue;
    if (isBibliographicCitation(line)) continue;
    if (line.length < 4 || line.length > 100) continue;

    // Deduplicate
    const normalized = line.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(line);
    }
  }

  return result;
}
