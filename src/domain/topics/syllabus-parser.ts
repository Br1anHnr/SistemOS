/**
 * Pure domain parser for extracting topics from syllabus text or uploaded documents.
 */

const IGNORED_SECTION_HEADERS = [
  /^ementa:?$/i,
  /^conteúdo\s+program[áa]tico:?$/i,
  /^programa\s+da\s+disciplina:?$/i,
  /^plano\s+de\s+ensino:?$/i,
  /^objetivos?:?$/i,
  /^bibliografia(\s+b[áa]sica|\s+complementar)?:?$/i,
  /^refer[êe]ncias:?$/i,
  /^crit[ée]rios?\s+de\s+avalia[çc][ãa]o:?$/i,
  /^metodologia:?$/i,
  /^carga\s+hor[áa]ria:?.*$/i,
  /^professor(a)?:?.*$/i,
  /^c[óo]digo:?.*$/i,
  /^semestre:?.*$/i,
  /^universidade.*$/i,
  /^faculdade.*$/i,
  /^instituto.*$/i,
  /^departamento.*$/i,
];

export function parseSyllabusText(rawText: string): string[] {
  if (!rawText || rawText.trim().length === 0) return [];

  const lines = rawText.split(/\r?\n/);
  const result: string[] = [];
  const seen = new Set<string>();

  for (let line of lines) {
    line = line.trim();

    if (line.length === 0) continue;

    // Check if line matches an ignored section header
    const isIgnoredHeader = IGNORED_SECTION_HEADERS.some((pattern) =>
      pattern.test(line)
    );
    if (isIgnoredHeader) continue;

    // Strip markdown formatting like ### or **
    line = line.replace(/^#{1,6}\s+/, "");
    line = line.replace(/^\*{1,2}(.*?)\*{1,2}$/, "$1");

    // Strip leading numbering, bullets, roman numerals, unit prefixes
    // Examples: "1. ", "1.1 ", "1.1.2 - ", "- ", "* ", "• ", "I - ", "Unidade 1: ", "Módulo 2 - ", "Capítulo 3: "
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

    // Skip lines that are too short or overly long descriptive paragraphs
    if (line.length < 3) continue;
    if (line.length > 180) continue;

    // Skip if it looks like pure punctuation or numbers
    if (/^[0-9\s\.\,\;\:\-\–—]+$/.test(line)) continue;

    // Deduplicate
    const normalized = line.toLowerCase();
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(line);
    }
  }

  return result;
}
