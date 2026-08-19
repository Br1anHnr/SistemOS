"use client";

import * as React from "react";
import {
  Upload,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  BookOpen,
  ListOrdered,
  Sparkles,
} from "lucide-react";
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

  // Core fields
  const [referenceNumber, setReferenceNumber] = React.useState<string>("");
  const [statement, setStatement] = React.useState<string>("");
  const [statementPhotos, setStatementPhotos] = React.useState<StatementPhoto[]>([]);

  // Secondary fields (collapsible)
  const [showMoreOptions, setShowMoreOptions] = React.useState<boolean>(false);
  const [title, setTitle] = React.useState<string>("");
  const [topicId, setTopicId] = React.useState<string>("");
  const [exerciseSetId, setExerciseSetId] = React.useState<string>("");
  const [difficulty, setDifficulty] = React.useState<number>(3);
  const [source, setSource] = React.useState<string>("");
  const [sourcePage, setSourcePage] = React.useState<string>("");

  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (open) {
      if (exerciseToEdit) {
        setReferenceNumber(exerciseToEdit.referenceNumber || "");
        setStatement(exerciseToEdit.statement || "");
        setTitle(exerciseToEdit.title || "");
        setTopicId(exerciseToEdit.topicId || defaultTopicId || "");
        setExerciseSetId(exerciseToEdit.exerciseSetId || defaultExerciseSetId || "");
        setDifficulty(exerciseToEdit.difficulty ?? 3);
        setSource(exerciseToEdit.source || "");
        setSourcePage(exerciseToEdit.sourcePage ? exerciseToEdit.sourcePage.toString() : "");
        setStatementPhotos([]);
        setShowMoreOptions(!!(exerciseToEdit.source || exerciseToEdit.sourcePage || exerciseToEdit.exerciseSetId));
      } else {
        setReferenceNumber("");
        setStatement("");
        setTitle("");
        setTopicId(defaultTopicId || "");
        setExerciseSetId(defaultExerciseSetId || "");
        setDifficulty(3);
        setSource("");
        setSourcePage("");
        setStatementPhotos([]);
        setShowMoreOptions(false);
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

    const hasText = statement.trim().length > 0;
    const hasPhotos = statementPhotos.length > 0;
    const hasRef = referenceNumber.trim().length > 0;
    const hasCustomTitle = title.trim().length > 0;

    // Minimum requirement: Text OR Photo OR Ref/Title
    if (!hasText && !hasPhotos && !hasRef && !hasCustomTitle) {
      toast("Adicione pelo menos um texto de enunciado, uma imagem ou uma identificação (ex: Q01).", "error");
      return;
    }

    setLoading(true);
    try {
      // Auto derive title if not explicitly provided
      const derivedTitle =
        title.trim() ||
        (referenceNumber.trim()
          ? `Questão ${referenceNumber.trim()}`
          : statement.trim()
          ? statement.trim().slice(0, 50)
          : "Exercício");

      if (exerciseToEdit) {
        const res = await updateExerciseAction(exerciseToEdit.id, subjectId, {
          title: derivedTitle,
          referenceNumber: referenceNumber.trim() || null,
          topicId: topicId || null,
          exerciseSetId: exerciseSetId || null,
          difficulty,
          statement: statement.trim() || null,
          source: source.trim() || null,
          sourcePage: sourcePage ? parseInt(sourcePage, 10) : null,
        });

        if (res.success) {
          toast("Exercício atualizado!");
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
          title: derivedTitle,
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
          toast("Exercício adicionado com sucesso!");
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
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-neutral-100">
              {exerciseToEdit ? "Editar Exercício" : "Novo Exercício"}
            </h3>
          </div>
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
          {/* Reference / Number */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Número / Referência <span className="text-neutral-500 font-normal">(opcional)</span>
            </label>
            <Input
              placeholder="Ex: Q01, 3.14, Ex. 7"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="bg-neutral-950 border-neutral-800 text-neutral-100 text-xs h-9 placeholder:text-neutral-600 font-mono"
            />
          </div>

          {/* Enunciado (Texto ou Imagem) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-neutral-200 font-semibold uppercase tracking-wider text-[11px]">
                Enunciado da Questão
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-6 text-[11px] border-purple-800/70 text-purple-300 hover:bg-purple-950/40 gap-1"
              >
                <ImageIcon className="h-3 w-3" />
                + Adicionar Imagem
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

            <textarea
              rows={3}
              placeholder="Escreva o texto do problema ou dados da questão..."
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500 resize-none text-xs leading-relaxed"
            />

            {/* Previews of attached statement images */}
            {statementPhotos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {statementPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="relative group border border-neutral-800 bg-neutral-950 rounded-lg overflow-hidden flex flex-col"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-neutral-900 flex items-center justify-center">
                      <img
                        src={photo.previewUrl}
                        alt="Prévia"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-1.5 flex items-center justify-between gap-1 bg-neutral-950 border-t border-neutral-850">
                      <span className="text-[10px] text-neutral-300 truncate max-w-[120px]">
                        {photo.file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="p-1 text-neutral-500 hover:text-red-400 rounded"
                        title="Remover imagem"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Collapsible Secondary Options */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMoreOptions((prev) => !prev)}
              className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-200 text-xs font-medium py-1 transition-colors"
            >
              {showMoreOptions ? (
                <ChevronUp className="h-3.5 w-3.5 text-purple-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
              )}
              <span>{showMoreOptions ? "Ocultar opções secundárias" : "Mais opções (título, lista, fonte, dificuldade...)"}</span>
            </button>

            {showMoreOptions && (
              <div className="mt-3 p-3.5 bg-neutral-950/70 border border-neutral-800/80 rounded-lg space-y-3 animate-in fade-in duration-150">
                {/* Custom Title */}
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">
                    Título personalizado (opcional)
                  </label>
                  <Input
                    placeholder="Ex: Teorema de Stevin no Tubo"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-neutral-900 border-neutral-800 text-neutral-100 text-xs h-8"
                  />
                </div>

                {/* Topic selector (only if not pre-set) */}
                {!defaultTopicId && topicsList.length > 0 && (
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      Vincular ao Capítulo
                    </label>
                    <select
                      value={topicId}
                      onChange={(e) => setTopicId(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Nenhum capítulo (Geral)</option>
                      {topicsList.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Exercise Set selector (only if not pre-set) */}
                {!defaultExerciseSetId && exerciseSetsList.length > 0 && (
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1 flex items-center gap-1">
                      <ListOrdered className="h-3 w-3" />
                      Lista de Exercícios
                    </label>
                    <select
                      value={exerciseSetId}
                      onChange={(e) => setExerciseSetId(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-md px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Exercício Avulso (Sem lista)</option>
                      {exerciseSetsList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Difficulty */}
                <div>
                  <label className="block text-neutral-400 font-medium mb-1">
                    Dificuldade (1 a 5)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setDifficulty(lvl)}
                        className={`flex-1 h-7 rounded text-xs font-semibold transition-colors ${
                          difficulty === lvl
                            ? "bg-purple-600 text-white"
                            : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Source and Page */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1">
                      Fonte / Livro
                    </label>
                    <Input
                      placeholder="Ex: Halliday Vol 2"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="bg-neutral-900 border-neutral-800 text-neutral-100 text-xs h-8"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 font-medium mb-1">
                      Página
                    </label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Ex: 48"
                      value={sourcePage}
                      onChange={(e) => setSourcePage(e.target.value)}
                      className="bg-neutral-900 border-neutral-800 text-neutral-100 text-xs h-8"
                    />
                  </div>
                </div>
              </div>
            )}
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
              className="bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs h-9 px-4 shadow-sm"
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
