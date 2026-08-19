/**
 * Pure domain parser for extracting topics from syllabus text or uploaded documents.
 * Features content boundary detection and strict anti-noise heuristic filters.
 */

interface ParserOptions {
  subjectName?: string | null;
  subjectCode?: string | null;
}

const SECTION_START_REGEX =
  /(conte[úu]do\s+program[áa]tico|programa\s+da\s+disciplina|plano\s+de\s+ensino|ementa|unidades?\s+tem[áa]ticas?|t[óo]picos?\s+(abordados?|programados?)|roteiro\s+do\s+curso|cronograma(\s+de\s+aulas?)?|sum[áa]rio(\s+das?\s+aulas?)?)/i;

const SECTION_END_REGEX =
  /(bibliografia(\s+b[áa]sica|\s+complementar)?|refer[êe]ncias(\s+bibliogr[áa]ficas)?|crit[ée]rios?\s+de\s+avalia[çc][ãa]o|sistema\s+de\s+avalia[çc][ãa]o|avalia[çc][ãa]o|metodologia(\s+de\s+ensino)?|datas?\s+das?\s+provas?|atendimento\s+ao\s+aluno|regras?\s+do\s+curso|disposi[çc][õo]es\s+gerais)/i;

const PUBLISHERS_AND_CITATIONS =
  /\b(ltc|pearson|mcgraw[\s\-]hill|editora|ed\.|vol\.|volume|isbn|p[áa]g\.|pp\.|cap\.|livros?|blucher|bookman|cengage|saraiva|campus|elsevier|springer|wiley)\b/i;

const CONTACT_AND_WEB_REGEX =
  /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|mail:|email:|e-mail:|contato:|whatsapp:|http:\/\/|https:\/\/|www\.)/i;

const ADMIN_METADATA_REGEX =
  /^(universidade|faculdade|instituto|departamento|disciplina|docente|professor(a)?|campus|turma|sala|hor[áa]rio|carga\s+hor[áa]ria|per[íi]odo|semestre|ano\s+letivo|c[óo]digo|cr[ée]ditos?|unesp|usp|unicamp|uf\w+)\b/i;

/**
 * Checks if a string looks like an ABNT bibliographic citation.
 * e.g. "FOX, R. W.; MCDONALD, A. T.; PRITCHARD, P. J. Introdução à Mecânica..."
 * or "BERGMAN, T. L.; LAVINE, A. S. Incropera:..."
 * or "LTC, 2019."
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
    // If it contains a publisher name + year, it's definitely bibliography
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
 * Extracts programmatic content between section markers if present.
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
      // Found the end of programmatic section
      endIndex = i;
      break;
    }
  }

  // If a distinct programmatic section was found with at least 2 lines
  if (startIndex !== -1) {
    const sliceEnd = endIndex !== -1 ? endIndex : lines.length;
    const slice = lines.slice(startIndex, sliceEnd).join("\n");
    return slice;
  }

  return rawText;
}

export function parseSyllabusText(
  rawText: string,
  options?: ParserOptions
): string[] {
  if (!rawText || rawText.trim().length === 0) return [];

  // Step 1: Attempt to extract focused programmatic section
  const targetedText = extractProgrammaticSlice(rawText);
  const lines = targetedText.split(/\r?\n/);

  const result: string[] = [];
  const seen = new Set<string>();

  const normalizedSubjectName = options?.subjectName
    ?.trim()
    .toLowerCase();
  const normalizedSubjectCode = options?.subjectCode
    ?.trim()
    .toLowerCase();

  for (let line of lines) {
    line = line.trim();

    if (line.length === 0) continue;

    // 1. Filter out emails, websites and contacts
    if (CONTACT_AND_WEB_REGEX.test(line)) continue;

    // 2. Filter out section headers (e.g. "Conteúdo Programático:", "Ementa:")
    if (SECTION_START_REGEX.test(line) && line.length < 50) continue;
    if (SECTION_END_REGEX.test(line) && line.length < 50) continue;

    // 3. Filter out administrative metadata (e.g. "Professor:", "Carga Horária: 60h")
    if (ADMIN_METADATA_REGEX.test(line)) continue;

    // 4. Filter out bibliographic citations
    if (isBibliographicCitation(line)) continue;

    // 5. Filter out subject name/code headers if matching current subject
    const lineLower = line.toLowerCase();
    if (normalizedSubjectName && lineLower === normalizedSubjectName) continue;
    if (normalizedSubjectCode && lineLower === normalizedSubjectCode) continue;

    // Strip markdown formatting like ### or **
    line = line.replace(/^#{1,6}\s+/, "");
    line = line.replace(/^\*{1,2}(.*?)\*{1,2}$/, "$1");

    // Strip leading numbering, bullets, roman numerals, unit prefixes
    // Examples: "1. ", "1.1 ", "1.1.2 - ", "- ", "* ", "• ", "I - ", "Unidade 1: ", "Aula 1 - ", "Capítulo 3: "
    line = line.replace(
      /^(unidade|m[óo]dulo|cap[íi]tulo|tema|aula|se[çc][ãa]o)\s+([0-9IVXLCDMivxlcdm]+)\s*[:\-–—.]?\s*/i,
      ""
    );
    line = line.replace(
      /^([0-9]{1,3}(\.[0-9]{1,3})*|[IVXLCDMivxlcdm]+|[a-zA-Z])\s*[\)\.\-–—:]\s*/,
      ""
    );
    line = line.replace(/^[\-\*•–—►▪▫◦]\s*/, "");
    line = line.replace(/^\d+\s+/, ""); // e.g. "1 Introdução"

    line = line.trim();

    // Skip lines that are too short (< 4 chars) or excessively long descriptive paragraphs
    if (line.length < 4) continue;
    if (line.length > 140) continue;

    // Skip if it looks like pure punctuation or numbers (e.g. "2026", "1/20")
    if (/^[0-9\s\.\,\;\:\-\–\—\/\(\)]+$/.test(line)) continue;

    // Second check after strip: make sure it's not a citation residue (e.g. "LTC, 2019")
    if (isBibliographicCitation(line)) continue;

    // Deduplicate
    const normalized = line.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(line);
    }
  }

  return result;
}
