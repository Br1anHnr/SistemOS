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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  createTopicAction,
  batchCreateTopicsAction,
} from "@/actions/topic.actions";
import { createMaterialAction } from "@/actions/material.actions";
import { parseSyllabusFileAction } from "@/actions/syllabus-file.actions";
import {
  parseSyllabusText,
  deriveModuleTitleFromFileName,
} from "@/domain/topics/syllabus-parser";
import {
  Loader2,
  Wand2,
  UploadCloud,
  FileText,
  Trash2,
  Plus,
  CheckCircle2,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  BookOpen,
} from "lucide-react";

interface TopicDraftItem {
  id: string;
  title: string;
  selected: boolean;
}

interface BatchTopicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  subjectName?: string | null;
  subjectCode?: string | null;
  assessments?: Array<{ id: string; title: string }>;
  onSuccess?: () => void;
}

export function BatchTopicModal({
  open,
  onOpenChange,
  subjectId,
  subjectName,
  subjectCode,
  assessments = [],
  onSuccess,
}: BatchTopicModalProps) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = React.useState<"FILE" | "TEXT">("FILE");
  const [importStructure, setImportStructure] = React.useState<
    "MODULE_WITH_SUBTOPICS" | "FLAT_TOPICS"
  >("MODULE_WITH_SUBTOPICS");

  const [loading, setLoading] = React.useState(false);
  const [extracting, setExtracting] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Module name if creating module with subtopics
  const [moduleTitle, setModuleTitle] = React.useState<string>("");

  // Parsed / extracted topics list with selection status
  const [topicDrafts, setTopicDrafts] = React.useState<TopicDraftItem[]>([]);
  const [sourceFileName, setSourceFileName] = React.useState<string | null>(null);
  const [uploadedBlobUrl, setUploadedBlobUrl] = React.useState<string | null>(null);
  const [newTopicInput, setNewTopicInput] = React.useState("");

  // Manual text mode
  const [rawText, setRawText] = React.useState("");

  // Assessment linking
  const [assessmentId, setAssessmentId] = React.useState<string>("");

  React.useEffect(() => {
    setMode("FILE");
    setImportStructure("MODULE_WITH_SUBTOPICS");
    setTopicDrafts([]);
    setSourceFileName(null);
    setUploadedBlobUrl(null);
    setModuleTitle("");
    setRawText("");
    setNewTopicInput("");
    setAssessmentId("");
    setError(null);
  }, [open]);

  const setTopicsFromList = (titles: string[], fileName: string, blobUrl?: string) => {
    const drafts: TopicDraftItem[] = titles.map((t, idx) => ({
      id: `${Date.now()}-${idx}`,
      title: t,
      selected: true,
    }));
    setTopicDrafts(drafts);
    setSourceFileName(fileName);
    setModuleTitle(deriveModuleTitleFromFileName(fileName));
    if (blobUrl) setUploadedBlobUrl(blobUrl);
  };

  // Handle file drop or selection
  const handleProcessFile = async (file: File) => {
    setError(null);
    setExtracting(true);

    try {
      const fileName = file.name.toLowerCase();
      const objectUrl = URL.createObjectURL(file);

      // Save material record silently for the in-app PDF reader
      try {
        await createMaterialAction({
          subjectId,
          title: file.name.replace(/\.[^/.]+$/, ""),
          fileName: file.name,
          fileType: "PDF",
          fileUrl: objectUrl,
          fileSize: file.size,
        });
      } catch {
        // Silently continue
      }

      // 1. Client-side quick reading for text-based files
      if (
        fileName.endsWith(".txt") ||
        fileName.endsWith(".md") ||
        fileName.endsWith(".markdown") ||
        fileName.endsWith(".csv")
      ) {
        const text = await file.text();
        const extracted = parseSyllabusText(text, {
          subjectName,
          subjectCode,
          fileName: file.name,
        });

        if (extracted.length === 0) {
          setError("Nenhum tópico programático identificado no arquivo.");
          setExtracting(false);
          return;
        }

        setTopicsFromList(extracted, file.name, objectUrl);
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
            const extracted = parseSyllabusText(textContent, {
              subjectName,
              subjectCode,
              fileName: file.name,
            });

            if (extracted.length > 0) {
              setTopicsFromList(extracted, file.name, objectUrl);
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
      if (subjectName) formData.append("subjectName", subjectName);
      if (subjectCode) formData.append("subjectCode", subjectCode);

      const res = await parseSyllabusFileAction(formData);

      if (!res.success || !res.topics) {
        setError(res.error || "Erro ao extrair tópicos do arquivo.");
      } else {
        setTopicsFromList(res.topics, res.fileName || file.name, objectUrl);
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

  const handleToggleSelect = (index: number) => {
    setTopicDrafts((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const handleSelectAll = (select: boolean) => {
    setTopicDrafts((prev) =>
      prev.map((item) => ({ ...item, selected: select }))
    );
  };

  const handleUpdateTopicTitle = (index: number, newTitle: string) => {
    setTopicDrafts((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, title: newTitle } : item
      )
    );
  };

  const handleRemoveTopic = (index: number) => {
    setTopicDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddManualTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTopicInput.trim().length > 0) {
      setTopicDrafts((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${prev.length}`,
          title: newTopicInput.trim(),
          selected: true,
        },
      ]);
      setNewTopicInput("");
    }
  };

  // Convert rawText in manual mode
  const handleParseManualText = () => {
    const extracted = parseSyllabusText(rawText, {
      subjectName,
      subjectCode,
    });
    if (extracted.length === 0) {
      setError("Nenhum tópico válido encontrado no texto.");
      return;
    }
    setTopicsFromList(extracted, "Texto colado manualmente");
  };

  const selectedCount = topicDrafts.filter((t) => t.selected).length;

  // Submit selected topics to database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedTopics = topicDrafts
      .filter((t) => t.selected)
      .map((t) => t.title.trim())
      .filter((t) => t.length > 0);

    if (selectedTopics.length === 0) {
      setError("Selecione pelo menos um conteúdo para cadastrar.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (importStructure === "MODULE_WITH_SUBTOPICS") {
        // 1. Create parent module
        const parentRes = await createTopicAction({
          subjectId,
          title: moduleTitle.trim() || "Módulo de Aula",
          description: sourceFileName ? `Material: ${sourceFileName}` : null,
          masteryLevel: 0,
          importance: 3,
          assessmentId: assessmentId || null,
        });

        if (!parentRes.success || !parentRes.data) {
          setError(parentRes.error || "Erro ao criar módulo da aula.");
          setLoading(false);
          return;
        }

        const parentId = parentRes.data.id;

        // 2. Batch create subtopics under this parent
        const joinedText = selectedTopics.join("\n");
        await batchCreateTopicsAction({
          subjectId,
          parentId,
          rawText: joinedText,
          assessmentId: assessmentId || null,
        });

        toast(`Módulo "${moduleTitle}" e ${selectedTopics.length} subconteúdos criados!`);
      } else {
        // Flat topics
        const joinedText = selectedTopics.join("\n");
        const res = await batchCreateTopicsAction({
          subjectId,
          rawText: joinedText,
          assessmentId: assessmentId || null,
        });

        if (!res.success) {
          setError(res.error || "Erro ao salvar tópicos.");
          setLoading(false);
          return;
        }

        toast(`${res.count} tópicos cadastrados com sucesso!`);
      }

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
            Importar Ementa e Slides de Aula
          </DialogTitle>
          <DialogDescription>
            Arraste os slides da aula (PDF) ou a ementa da matéria para extrair os tópicos e subconteúdos.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 rounded-md bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Mode Selector Tabs (only if no topics extracted yet) */}
        {topicDrafts.length === 0 && (
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
              Arrastar Slides / PDF da Aula
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
              Colar Sumário / Texto
            </button>
          </div>
        )}

        <div className="space-y-4 text-sm">
          {/* STATE 1: Dropzone File Mode (No topics yet) */}
          {topicDrafts.length === 0 && mode === "FILE" && (
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
                      Analisando slides da aula e identificando tópicos...
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Filtrando parágrafos explicativos e isolando títulos dos slides.
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-2.5">
                    <div className="h-12 w-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-purple-400">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-100">
                        Arraste o PDF da aula ou ementa aqui
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
          {topicDrafts.length === 0 && mode === "TEXT" && (
            <div className="space-y-3">
              <textarea
                rows={8}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Cole o sumário ou ementa aqui...\nExemplo:\n1. Características e Propriedades dos Fluidos\n2. Viscosidade Dinâmica e Cinemática\n3. Tensão Superficial e Capilaridade\n4. Pressão de Vapor e Cavitação`}
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
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-purple-400" />
                Extrair Tópicos
              </Button>
            </div>
          )}

          {/* STATE 3: Extracted Topics Preview & Hierarchy Config */}
          {topicDrafts.length > 0 && (
            <div className="space-y-4">
              {/* Structure Choice Selector */}
              <div className="p-3 rounded-lg bg-neutral-900/70 border border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-purple-400" />
                    Como organizar estes conteúdos:
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportStructure("MODULE_WITH_SUBTOPICS")}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      importStructure === "MODULE_WITH_SUBTOPICS"
                        ? "bg-purple-950/30 border-purple-700 text-purple-200"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <div className="text-xs font-semibold text-neutral-100">
                      Criar 1 Módulo de Aula
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      Cria o capítulo principal e salva os itens abaixo como subtópicos.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportStructure("FLAT_TOPICS")}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      importStructure === "FLAT_TOPICS"
                        ? "bg-purple-950/30 border-purple-700 text-purple-200"
                        : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    <div className="text-xs font-semibold text-neutral-100">
                      Tópicos Independentes
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">
                      Cadastra cada item como um tópico separado da ementa geral.
                    </div>
                  </button>
                </div>

                {importStructure === "MODULE_WITH_SUBTOPICS" && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                      Título do Módulo / Capítulo da Aula:
                    </label>
                    <Input
                      value={moduleTitle}
                      onChange={(e) => setModuleTitle(e.target.value)}
                      placeholder="Ex: Capítulo 2: Conceitos Fundamentais e Propriedades"
                      className="text-xs bg-neutral-950 border-neutral-800"
                    />
                  </div>
                )}
              </div>

              {/* Subtopics Header & Batch Select */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-850">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold text-neutral-200">
                    {selectedCount} de {topicDrafts.length} conteúdos selecionados
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(selectedCount !== topicDrafts.length)}
                    className="text-[11px] text-neutral-400 hover:text-neutral-200 underline decoration-neutral-700"
                  >
                    {selectedCount === topicDrafts.length
                      ? "Desmarcar todos"
                      : "Selecionar todos"}
                  </button>
                  <span className="text-neutral-700">|</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTopicDrafts([]);
                      setSourceFileName(null);
                    }}
                    className="h-6 text-[11px] text-neutral-400 hover:text-white p-1"
                  >
                    Trocar arquivo
                  </Button>
                </div>
              </div>

              {/* Scrollable list of detected topics */}
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {topicDrafts.map((draft, idx) => (
                  <div
                    key={draft.id}
                    className={`flex items-center justify-between gap-2 p-1.5 px-2.5 rounded border transition-colors ${
                      draft.selected
                        ? "bg-neutral-900/80 border-neutral-800"
                        : "bg-neutral-950/40 border-neutral-900 opacity-50"
                    }`}
                  >
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(idx)}
                      className="text-neutral-400 hover:text-white shrink-0"
                    >
                      {draft.selected ? (
                        <CheckSquare className="h-4 w-4 text-purple-400" />
                      ) : (
                        <Square className="h-4 w-4 text-neutral-600" />
                      )}
                    </button>

                    <span className="text-[10px] font-mono text-neutral-500 w-4 shrink-0 text-right">
                      {idx + 1}.
                    </span>

                    {/* Editable Topic Title */}
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(e) => handleUpdateTopicTitle(idx, e.target.value)}
                      className={`flex-1 bg-transparent text-xs text-neutral-200 focus:bg-neutral-950 focus:px-2 focus:py-1 focus:rounded focus:outline-none focus:ring-1 focus:ring-purple-500/50 ${
                        !draft.selected && "line-through text-neutral-500"
                      }`}
                    />

                    {/* Individual Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(idx)}
                      className="p-1 text-neutral-500 hover:text-red-400 shrink-0"
                      title="Excluir da lista"
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
                  placeholder="+ Adicionar outro subconteúdo à lista..."
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
                    Vincular a uma avaliação (opcional)
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

          {topicDrafts.length > 0 && (
            <Button
              type="submit"
              disabled={loading || extracting || selectedCount === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : importStructure === "MODULE_WITH_SUBTOPICS" ? (
                `Criar Módulo com ${selectedCount} Subconteúdo(s)`
              ) : (
                `Cadastrar ${selectedCount} Tópico(s)`
              )}
            </Button>
          )}
        </DialogFooter>
      </form>
    </Dialog>
  );
}
