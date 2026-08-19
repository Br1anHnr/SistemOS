"use client";

import * as React from "react";
import { Upload, Trash2, Loader2, BookOpen, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ExerciseItem } from "@/domain/exercises";
import { createExerciseAction, updateExerciseAction } from "@/actions/exercise.actions";
import { storeLocalFile, fileToDataUrl } from "@/lib/file-storage";

interface ExerciseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  exerciseToEdit?: ExerciseItem | null;
  defaultTopicId?: string | null;
  defaultExerciseSetId?: string | null;
  topicsList?: { id: string; title: string }[];
  exerciseSetsList?: { id: string; title: string }[];
  onSuccess?: () => void;
}

interface StatementPhoto {
  file: File;
  previewUrl: string;
  caption: string;
}

export function ExerciseModal({
  open,
  onOpenChange,
  subjectId,
  exerciseToEdit,
  defaultTopicId,
  defaultExerciseSetId,
  topicsList = [],
  exerciseSetsList = [],
  onSuccess,
}: ExerciseModalProps) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = React.useState<string>("");
  const [referenceNumber, setReferenceNumber] = React.useState<string>("");
  const [topicId, setTopicId] = React.useState<string>("");
  const [exerciseSetId, setExerciseSetId] = React.useState<string>("");
  const [difficulty, setDifficulty] = React.useState<number>(3);
  const [statement, setStatement] = React.useState<string>("");
  const [source, setSource] = React.useState<string>("");
  const [sourcePage, setSourcePage] = React.useState<string>("");
  const [statementPhotos, setStatementPhotos] = React.useState<StatementPhoto[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (open) {
      if (exerciseToEdit) {
        setTitle(exerciseToEdit.title);
        setReferenceNumber(exerciseToEdit.referenceNumber || "");
        setTopicId(exerciseToEdit.topicId || "");
        setExerciseSetId(exerciseToEdit.exerciseSetId || "");
        setDifficulty(exerciseToEdit.difficulty ?? 3);
        setStatement(exerciseToEdit.statement || "");
        setSource(exerciseToEdit.source || "");
        setSourcePage(exerciseToEdit.sourcePage ? exerciseToEdit.sourcePage.toString() : "");
        setStatementPhotos([]);
      } else {
        setTitle("");
        setReferenceNumber("");
        setTopicId(defaultTopicId || "");
        setExerciseSetId(defaultExerciseSetId || "");
        setDifficulty(3);
        setStatement("");
        setSource("");
        setSourcePage("");
        setStatementPhotos([]);
      }
      setLoading(false);
    }
  }, [open, exerciseToEdit, defaultTopicId, defaultExerciseSetId]);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: StatementPhoto[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      newPhotos.push({
        file,
        previewUrl,
        caption: `Figura ${statementPhotos.length + i + 1}`,
      });
    }

    setStatementPhotos((prev) => [...prev, ...newPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    setStatementPhotos((prev) => {
      const item = prev[index];
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast("O título do exercício é obrigatório.", "error");
      return;
    }

    setLoading(true);
    try {
      if (exerciseToEdit) {
        const res = await updateExerciseAction(exerciseToEdit.id, subjectId, {
          title: title.trim(),
          referenceNumber: referenceNumber.trim() || null,
          topicId: topicId || null,
          exerciseSetId: exerciseSetId || null,
          difficulty,
          statement: statement.trim() || null,
          source: source.trim() || null,
          sourcePage: sourcePage ? parseInt(sourcePage, 10) : null,
        });

        if (res.success) {
          toast("Exercício atualizado com sucesso!");
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast(res.error || "Erro ao atualizar exercício.", "error");
        }
      } else {
        // Upload any attached statement images
        const statementImages = [];
        for (const photo of statementPhotos) {
          const fileId = `stmt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          let filePath = "";
          try {
            filePath = await storeLocalFile(fileId, photo.file);
          } catch {
            filePath = await fileToDataUrl(photo.file);
          }

          statementImages.push({
            filePath,
            mimeType: photo.file.type || "image/png",
            originalName: photo.file.name,
            caption: photo.caption.trim() || null,
          });
        }

        const res = await createExerciseAction({
          subjectId,
          title: title.trim(),
          referenceNumber: referenceNumber.trim() || null,
          topicId: topicId || null,
          exerciseSetId: exerciseSetId || null,
          difficulty,
          statement: statement.trim() || null,
          source: source.trim() || null,
          sourcePage: sourcePage ? parseInt(sourcePage, 10) : null,
          statementImages,
        });

        if (res.success) {
          toast("Exercício cadastrado com sucesso!");
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast(res.error || "Erro ao criar exercício.", "error");
        }
      }
    } catch {
      toast("Erro ao salvar exercício.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-100">
            {exerciseToEdit ? "Editar Exercício" : "Novo Exercício"}
          </h3>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-neutral-400 hover:text-white p-1 rounded-md"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Reference & Title */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Ref / N° (opcional)
              </label>
              <Input
                placeholder="Ex: Q01, 3.14"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-neutral-100 text-xs h-9"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-neutral-300 font-medium mb-1">
                Título do Exercício *
              </label>
              <Input
                placeholder="Ex: Cálculo da Tensão de Cisalhamento"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-neutral-950 border-neutral-800 text-neutral-100 text-xs h-9"
              />
            </div>
          </div>

          {/* Topic / Chapter Selector & Exercise Set Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
                <BookOpen className="h-3 w-3 text-neutral-400" />
                Vincular ao Capítulo / Tópico
              </label>
              <select
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-2.5 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
              >
                <option value="">Nenhum capítulo (Geral)</option>
                {topicsList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
                <ListOrdered className="h-3 w-3 text-neutral-400" />
                Lista de Exercícios
              </label>
              <select
                value={exerciseSetId}
                onChange={(e) => setExerciseSetId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-2.5 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
              >
                <option value="">Exercício Avulso (Sem lista)</option>
                {exerciseSetsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Difficulty (1 to 5) */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">
              Dificuldade estimada (1 a 5)
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  className={`flex-1 h-8 rounded-md text-xs font-semibold transition-colors ${
                    difficulty === lvl
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-neutral-950 text-neutral-400 border border-neutral-800 hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Statement Text */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Enunciado / Descrição do Problema
            </label>
            <textarea
              rows={3}
              placeholder="Digite o texto da questão ou dados do problema..."
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-md p-2.5 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-purple-500 resize-none text-xs"
            />
          </div>

          {/* Statement Images Upload (for new exercises) */}
          {!exerciseToEdit && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-neutral-300 font-medium flex items-center gap-1">
                  <Upload className="h-3 w-3 text-neutral-400" />
                  Imagens do Enunciado (opcional)
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-6 text-[11px] border-neutral-800 text-neutral-300 hover:text-white"
                >
                  + Anexar Imagem
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                multiple
                onChange={handleFilesSelected}
                className="hidden"
              />

              {statementPhotos.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {statementPhotos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-1.5 bg-neutral-950 rounded border border-neutral-800"
                    >
                      <img
                        src={photo.previewUrl}
                        alt="Prévia"
                        className="h-9 w-9 object-cover rounded border border-neutral-800 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] text-neutral-300 truncate block">
                          {photo.file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="p-1 text-neutral-500 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Source and Page */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Fonte / Bibliografia (opcional)
              </label>
              <Input
                placeholder="Ex: Halliday Vol 2"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-neutral-100 text-xs h-9"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Página da Fonte (opcional)
              </label>
              <Input
                type="number"
                min="1"
                placeholder="Ex: 48"
                value={sourcePage}
                onChange={(e) => setSourcePage(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-neutral-100 text-xs h-9"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-neutral-400 hover:text-white text-xs h-9"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs h-9 px-4"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Salvando...
                </>
              ) : exerciseToEdit ? (
                "Atualizar Exercício"
              ) : (
                "Cadastrar Exercício"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
