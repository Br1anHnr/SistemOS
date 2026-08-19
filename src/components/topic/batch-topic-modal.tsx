"use client";

import * as React from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { batchCreateTopicsAction } from "@/actions/topic.actions";
import { parseSyllabusFileAction } from "@/actions/syllabus-file.actions";
import { parseSyllabusText } from "@/domain/topics/syllabus-parser";
import {
  Loader2,
  Wand2,
  UploadCloud,
  FileText,
  Trash2,
  Plus,
  CheckCircle2,
} from "lucide-react";

interface BatchTopicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  assessments?: Array<{ id: string; title: string }>;
  onSuccess?: () => void;
}

export function BatchTopicModal({
  open,
  onOpenChange,
  subjectId,
  assessments = [],
  onSuccess,
}: BatchTopicModalProps) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = React.useState<"FILE" | "TEXT">("FILE");
  const [loading, setLoading] = React.useState(false);
  const [extracting, setExtracting] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Parsed / extracted topics list
  const [topicsList, setTopicsList] = React.useState<string[]>([]);
  const [sourceFileName, setSourceFileName] = React.useState<string | null>(null);
  const [newTopicInput, setNewTopicInput] = React.useState("");

  // Manual text mode
  const [rawText, setRawText] = React.useState("");

  // Assessment linking
  const [assessmentId, setAssessmentId] = React.useState<string>("");

  React.useEffect(() => {
    setMode("FILE");
    setTopicsList([]);
    setSourceFileName(null);
    setRawText("");
    setNewTopicInput("");
    setAssessmentId("");
    setError(null);
  }, [open]);

  // Handle file drop or selection
  const handleProcessFile = async (file: File) => {
    setError(null);
    setExtracting(true);

    try {
      const fileName = file.name.toLowerCase();

      // 1. Client-side quick reading for text-based files
      if (
        fileName.endsWith(".txt") ||
        fileName.endsWith(".md") ||
        fileName.endsWith(".markdown") ||
        fileName.endsWith(".csv")
      ) {
        const text = await file.text();
        const extracted = parseSyllabusText(text);

        if (extracted.length === 0) {
          setError("Nenhum tópico programático identificado no arquivo de texto.");
          setExtracting(false);
          return;
        }

        setTopicsList(extracted);
        setSourceFileName(file.name);
        setExtracting(false);
        return;
      }

      // 2. Client-side extraction for PDF files (instant & avoids network size limits)
      if (fileName.endsWith(".pdf")) {
        try {
          const { extractText } = await import("unpdf");
          const arrayBuffer = await file.arrayBuffer();
          const pdfData = await extractText(new Uint8Array(arrayBuffer));
          const textContent = Array.isArray(pdfData.text)
            ? pdfData.text.join("\n")
            : (pdfData.text as string) || "";

          if (textContent && textContent.trim().length > 0) {
            const extracted = parseSyllabusText(textContent);

            if (extracted.length > 0) {
              setTopicsList(extracted);
              setSourceFileName(file.name);
              setExtracting(false);
              return;
            }
          }
        } catch {
          // If browser worker fails, fallback to server action below
        }
      }

      // 3. Server-side extraction fallback
      const formData = new FormData();
      formData.append("file", file);

      const res = await parseSyllabusFileAction(formData);

      if (!res.success || !res.topics) {
        setError(res.error || "Erro ao extrair tópicos do arquivo.");
      } else {
        setTopicsList(res.topics);
        setSourceFileName(res.fileName || file.name);
      }
    } catch {
      setError("Erro ao ler o arquivo enviado. Tente outro formato ou cole o texto na aba ao lado.");
    } finally {
      setExtracting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleProcessFile(file);
    }
  };

  const handleRemoveTopic = (index: number) => {
    setTopicsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddManualTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTopicInput.trim().length > 0) {
      setTopicsList((prev) => [...prev, newTopicInput.trim()]);
      setNewTopicInput("");
    }
  };

  // Convert rawText in manual mode
  const handleParseManualText = () => {
    const extracted = parseSyllabusText(rawText);
    if (extracted.length === 0) {
      setError("Nenhum tópico válido encontrado no texto.");
      return;
    }
    setTopicsList(extracted);
    setSourceFileName("Texto colado manualmente");
  };

  // Submit to database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topicsList.length === 0) {
      setError("Adicione pelo menos um tópico antes de confirmar.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const joinedText = topicsList.join("\n");
      const res = await batchCreateTopicsAction({
        subjectId,
        rawText: joinedText,
        assessmentId: assessmentId || null,
      });

      if (!res.success) {
        setError(res.error || "Erro ao salvar tópicos.");
        return;
      }

      toast(`${res.count} tópicos cadastrados com sucesso!`);
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setError("Erro inesperado ao salvar tópicos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-400" />
            Importar Ementa da Disciplina
          </DialogTitle>
          <DialogDescription>
            Arraste o arquivo com a ementa da matéria (PDF, TXT, MD) para extrair os tópicos automaticamente.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 rounded-md bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Mode Selector Tabs (only if no topics extracted yet) */}
        {topicsList.length === 0 && (
          <div className="flex rounded-lg bg-neutral-900 border border-neutral-800 p-0.5 mb-4 text-xs">
            <button
              type="button"
              onClick={() => setMode("FILE")}
              className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                mode === "FILE"
                  ? "bg-neutral-800 text-white font-semibold shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Arrastar Arquivo (PDF / TXT / MD)
            </button>
            <button
              type="button"
              onClick={() => setMode("TEXT")}
              className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                mode === "TEXT"
                  ? "bg-neutral-800 text-white font-semibold shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Colar Texto
            </button>
          </div>
        )}

        <div className="space-y-4 text-sm">
          {/* STATE 1: Dropzone File Mode (No topics yet) */}
          {topicsList.length === 0 && mode === "FILE" && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.markdown,.csv"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  isDragOver
                    ? "border-purple-500 bg-purple-950/20 scale-[1.01]"
                    : "border-neutral-800 hover:border-neutral-700 bg-neutral-950/60"
                }`}
              >
                {extracting ? (
                  <div className="text-center space-y-2 py-4">
                    <Loader2 className="h-10 w-10 text-purple-400 animate-spin mx-auto" />
                    <p className="text-xs font-semibold text-neutral-200">
                      Extraindo e analisando tópicos do arquivo...
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Isso leva apenas alguns instantes.
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-2.5">
                    <div className="h-12 w-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-purple-400">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-100">
                        Arraste e solte o arquivo da ementa aqui
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        ou clique para selecionar do seu computador
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-neutral-400">
                      <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 font-mono">
                        .PDF
                      </span>
                      <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 font-mono">
                        .TXT
                      </span>
                      <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 font-mono">
                        .MD
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STATE 2: Manual Text Mode (No topics yet) */}
          {topicsList.length === 0 && mode === "TEXT" && (
            <div className="space-y-3">
              <textarea
                rows={8}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Cole sua ementa aqui...\nExemplo:\n1. Introdução à Mecânica dos Fluidos\n2. Equação da Continuidade\n3. Balanço de Energia`}
                className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
                autoFocus
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleParseManualText}
                disabled={rawText.trim().length === 0}
                className="w-full text-xs"
              >
                Analisar e Extrair Tópicos
              </Button>
            </div>
          )}

          {/* STATE 3: Extracted Topics Preview List */}
          {topicsList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-850">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold text-neutral-200">
                    {topicsList.length} tópicos identificados
                  </span>
                  {sourceFileName && (
                    <span className="text-[11px] text-neutral-400 truncate max-w-xs">
                      ({sourceFileName})
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTopicsList([]);
                    setSourceFileName(null);
                  }}
                  className="h-6 text-[11px] text-neutral-400 hover:text-white p-1"
                >
                  Trocar arquivo
                </Button>
              </div>

              {/* Scrollable list of detected topics */}
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {topicsList.map((topic, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 rounded bg-neutral-900/60 border border-neutral-800 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] font-mono text-neutral-500 w-5 shrink-0 text-right">
                        {idx + 1}.
                      </span>
                      <span className="text-neutral-200 truncate">{topic}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(idx)}
                      className="p-1 text-neutral-500 hover:text-red-400 shrink-0"
                      title="Excluir tópico da lista"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Quick inline add another topic */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newTopicInput}
                  onChange={(e) => setNewTopicInput(e.target.value)}
                  placeholder="+ Adicionar outro tópico..."
                  className="flex-1 rounded-md border border-neutral-800 bg-neutral-950 px-2.5 py-1 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-700 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddManualTopic(e);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddManualTopic}
                  disabled={newTopicInput.trim().length === 0}
                  className="h-7 text-xs px-2.5 border-neutral-750"
                >
                  <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
              </div>

              {assessments.length > 0 && (
                <div className="pt-2 border-t border-neutral-850">
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Vincular todos a uma avaliação (opcional)
                  </label>
                  <Select
                    value={assessmentId}
                    onChange={(e) => setAssessmentId(e.target.value)}
                  >
                    <option value="">Nenhuma (geral)</option>
                    {assessments.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading || extracting}
          >
            Cancelar
          </Button>

          {topicsList.length > 0 && (
            <Button type="submit" disabled={loading || extracting}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                `Cadastrar ${topicsList.length} Tópicos`
              )}
            </Button>
          )}
        </DialogFooter>
      </form>
    </Dialog>
  );
}
