"use server";

import { parseSyllabusText } from "@/domain/topics/syllabus-parser";
import { extractText } from "unpdf";

export async function parseSyllabusFileAction(formData: FormData) {
  try {
    const file = formData.get("file") as File | null;
    const subjectName = (formData.get("subjectName") as string) || null;
    const subjectCode = (formData.get("subjectCode") as string) || null;

    if (!file) {
      return { success: false, error: "Nenhum arquivo enviado." };
    }

    const fileName = file.name.toLowerCase();
    let textContent = "";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (fileName.endsWith(".pdf")) {
      const pdfData = await extractText(new Uint8Array(arrayBuffer));
      textContent = Array.isArray(pdfData.text)
        ? pdfData.text.join("\n")
        : (pdfData.text as string) || "";
    } else {
      // txt, md, csv, etc.
      textContent = buffer.toString("utf-8");
    }

    if (!textContent || textContent.trim().length === 0) {
      return {
        success: false,
        error: "Não foi possível extrair texto do arquivo enviado.",
      };
    }

    const extractedTopics = parseSyllabusText(textContent, {
      subjectName,
      subjectCode,
    });

    if (extractedTopics.length === 0) {
      return {
        success: false,
        error:
          "Nenhum tópico programático identificado no arquivo. Tente colar o texto manualmente.",
      };
    }

    return {
      success: true,
      fileName: file.name,
      topics: extractedTopics,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: `Erro ao ler arquivo: ${error.message}` };
    }
    return { success: false, error: "Erro ao processar o arquivo enviado." };
  }
}
