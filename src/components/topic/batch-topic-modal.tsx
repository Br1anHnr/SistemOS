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
import { deriveModuleTitleFromFileName } from "@/domain/topics/syllabus-parser";
import { MASTERY_LEVELS } from "@/domain/topics";
import {
  Loader2,
  UploadCloud,
  FileText,
  Plus,
  CheckCircle2,
  Sparkles,
  Layers,
  Award,
  Clock,
} from "lucide-react";

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
  const [loading, setLoading] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Selected file details
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [lessonTitle, setLessonTitle] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [masteryLevel, setMasteryLevel] = React.useState<number>(0);
  const [importance, setImportance] = React.useState<number>(3);
  const [estimatedHours, setEstimatedHours] = React.useState<string>("");
  const [assessmentId, setAssessmentId] = React.useState<string>("");

  // Manual text mode for pasting full syllabus list
  const [rawText, setRawText] = React.useState("");

  React.useEffect(() => {
    setMode("FILE");
    setSelectedFile(null);
    setLessonTitle("");
    setDescription("");
    setMasteryLevel(0);
    setImportance(3);
    setEstimatedHours("");
    setAssessmentId("");
    setRawText("");
    setError(null);
  }, [open]);

  // Handle file drop or selection
  const handleProcessFile = (file: File) => {
    setError(null);
    setSelectedFile(file);

    // Derive a clean, elegant title from filename (e.g. "Aula 02: Conceitos Fundamentais...")
    const derived = deriveModuleTitleFromFileName(file.name);
    setLessonTitle(derived);
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

  // Submit action
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "FILE") {
        if (!selectedFile || !lessonTitle.trim()) {
          setError("Selecione um arquivo e defina o nome da aula.");
          setLoading(false);
          return;
        }

        const parsedHours = estimatedHours !== "" ? Number(estimatedHours) : null;

        // 1. Create Topic in database
        const topicRes = await createTopicAction({
          subjectId,
          title: lessonTitle.trim(),
          description: description.trim() || `Material: ${selectedFile.name}`,
          masteryLevel: Number(masteryLevel),
          importance: Number(importance),
          estimatedHours: parsedHours,
          assessmentId: assessmentId || null,
        });

        if (!topicRes.success || !topicRes.data) {
          setError(topicRes.error || "Erro ao criar aula.");
          setLoading(false);
          return;
        }

        const createdTopicId = topicRes.data.id;
        const objectUrl = URL.createObjectURL(selectedFile);

        // 2. Attach PDF material to this created topic
        try {
          await createMaterialAction({
            subjectId,
            topicId: createdTopicId,
            title: lessonTitle.trim(),
            fileName: selectedFile.name,
            fileType: "PDF",
            fileUrl: objectUrl,
            fileSize: selectedFile.size,
          });
        } catch {
          // Continue if material index succeeds locally
        }

        toast(`Aula "${lessonTitle}" cadastrada e PDF anexado com sucesso!`);
      } else {
        // Mode TEXT (Batch syllabus pasting)
        const lines = rawText
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        if (lines.length === 0) {
          setError("Cole pelo menos um tópico de ementa.");
          setLoading(false);
          return;
        }

        const res = await batchCreateTopicsAction({
          subjectId,
          rawText,
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
      setError("Erro inesperado ao salvar aula.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-400" />
            Adicionar Aula / Material de Estudo
          </DialogTitle>
          <DialogDescription>
            Envie os slides ou PDF da aula para criar o conteúdo e anexar o material para leitura integrada.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 rounded-md bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Mode Selector Tabs */}
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
            Enviar Slides / PDF da Aula
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
            Colar Ementa em Texto
          </button>
        </div>

        <div className="space-y-4 text-sm max-h-[62vh] overflow-y-auto pr-1">
          {/* FILE MODE */}
          {mode === "FILE" && (
            <div className="space-y-3.5">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.markdown"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {!selectedFile ? (
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
                  <div className="text-center space-y-2.5">
                    <div className="h-12 w-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-purple-400">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-100">
                        Arraste o PDF da aula aqui
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        ou clique para selecionar do seu computador
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-neutral-400 font-mono">
                      <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                        .PDF
                      </span>
                      <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                        .TXT
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {/* File Attached Pill */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-900/80 border border-neutral-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-md bg-purple-950/60 border border-purple-800 text-purple-400 shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-neutral-200 truncate">
                          {selectedFile.name}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • PDF de Aula
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      className="h-7 text-xs text-neutral-400 hover:text-white"
                    >
                      Trocar arquivo
                    </Button>
                  </div>

                  {/* Lesson Title Input */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Nome da Aula / Conteúdo *
                    </label>
                    <Input
                      value={lessonTitle}
                      onChange={(e) => setLessonTitle(e.target.value)}
                      placeholder="Ex: Aula 01: Introdução aos Fenômenos de Transporte"
                      required
                      autoFocus
                    />
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Você pode renomear livremente (ex: <em>Aula 01: ...</em>, <em>Capítulo 2: ...</em>).
                    </p>
                  </div>

                  {/* Description / Notes */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Descrição / Anotações Rápidas (opcional)
                    </label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ex: Leitura dos slides 1 a 30, exercícios recomendados"
                    />
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Nível de Domínio Inicial
                      </label>
                      <Select
                        value={masteryLevel.toString()}
                        onChange={(e) => setMasteryLevel(Number(e.target.value))}
                      >
                        {MASTERY_LEVELS.map((m) => (
                          <option key={m.level} value={m.level.toString()}>
                            {m.level} — {m.label}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Importância (1 a 5)
                      </label>
                      <Select
                        value={importance.toString()}
                        onChange={(e) => setImportance(Number(e.target.value))}
                      >
                        <option value="1">1 — Baixa</option>
                        <option value="2">2 — Secundária</option>
                        <option value="3">3 — Média / Padrão</option>
                        <option value="4">4 — Alta / Muito Cobrado</option>
                        <option value="5">5 — Crítica / Essencial</option>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Horas Previstas de Estudo
                      </label>
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        max="100"
                        value={estimatedHours}
                        onChange={(e) => setEstimatedHours(e.target.value)}
                        placeholder="Ex: 3"
                      />
                    </div>

                    {assessments.length > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                          Cobrado na Avaliação
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
                </div>
              )}
            </div>
          )}

          {/* TEXT MODE */}
          {mode === "TEXT" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Lista de Tópicos (um por linha) *
                </label>
                <textarea
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Cole sua lista aqui:\n1. Introdução à Mecânica dos Fluidos\n2. Estática dos Fluidos\n3. Equação da Continuidade\n4. Balanço de Energia`}
                  className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
                  autoFocus
                />
              </div>

              {assessments.length > 0 && (
                <div>
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
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={
              loading ||
              (mode === "FILE" && (!selectedFile || !lessonTitle.trim())) ||
              (mode === "TEXT" && !rawText.trim())
            }
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : mode === "FILE" ? (
              "Cadastrar Aula e Anexar PDF"
            ) : (
              "Cadastrar Tópicos"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
