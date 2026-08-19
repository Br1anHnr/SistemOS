"use client";

import * as React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RotateCcw,
  Clock,
  Gauge,
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  ListOrdered,
  Calendar,
  Image as ImageIcon,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  History,
  FileText,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { ExerciseItem, ExerciseAttemptItem } from "@/domain/exercises";
import {
  getExerciseByIdAction,
  deleteExerciseAction,
  toggleExerciseNeedsReviewAction,
  deleteExerciseAttemptAction,
  deleteAttemptAttachmentAction,
} from "@/actions/exercise.actions";
import { AttemptRegisterModal } from "./attempt-register-modal";
import { ImageLightboxModal } from "./image-lightbox-modal";
import { getLocalFileUrl } from "@/lib/file-storage";

interface ExerciseDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseId: string | null;
  subjectId: string;
  onEditExercise?: (exercise: ExerciseItem) => void;
  onSuccess?: () => void;
}

export function ExerciseDetailModal({
  open,
  onOpenChange,
  exerciseId,
  subjectId,
  onEditExercise,
  onSuccess,
}: ExerciseDetailModalProps) {
  const { toast } = useToast();

  const [exercise, setExercise] = React.useState<ExerciseItem | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [attemptModalOpen, setAttemptModalOpen] = React.useState<boolean>(false);
  const [showHistory, setShowHistory] = React.useState<boolean>(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = React.useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = React.useState<{
    url: string;
    caption?: string | null;
    originalName?: string | null;
  } | null>(null);

  // Resolved image URLs cache for IndexedDB / remote images
  const [resolvedUrls, setResolvedUrls] = React.useState<Record<string, string>>({});

  const loadExerciseDetails = React.useCallback(async () => {
    if (!open || !exerciseId) return;
    setLoading(true);
    try {
      const res = await getExerciseByIdAction(exerciseId, subjectId);
      if (res.success && res.data) {
        setExercise(res.data as ExerciseItem);

        // Resolve blob URLs for attachments
        const urlsToResolve: string[] = [];
        for (const att of res.data.attachments || []) {
          urlsToResolve.push(att.filePath);
        }
        for (const attempt of res.data.attempts || []) {
          for (const att of attempt.attachments || []) {
            urlsToResolve.push(att.filePath);
          }
        }

        const resolvedMap: Record<string, string> = {};
        for (const path of urlsToResolve) {
          resolvedMap[path] = await getLocalFileUrl(path);
        }
        setResolvedUrls(resolvedMap);
      }
    } catch {
      toast("Erro ao carregar detalhes do exercício.", "error");
    } finally {
      setLoading(false);
    }
  }, [open, exerciseId, subjectId, toast]);

  React.useEffect(() => {
    loadExerciseDetails();
  }, [loadExerciseDetails]);

  const handleToggleReview = async () => {
    if (!exercise) return;
    const newStatus = !exercise.needsReview;
    try {
      const res = await toggleExerciseNeedsReviewAction(exercise.id, subjectId, newStatus);
      if (res.success) {
        toast(newStatus ? "Marcado para refazer!" : "Desmarcado de refazer.");
        await loadExerciseDetails();
        onSuccess?.();
      }
    } catch {
      toast("Erro ao atualizar revisão.", "error");
    }
  };

  const handleDeleteExercise = async () => {
    if (!exercise) return;
    if (!confirm(`Tem certeza que deseja excluir o exercício "${exercise.title}"?`)) return;

    try {
      const res = await deleteExerciseAction(exercise.id, subjectId);
      if (res.success) {
        toast("Exercício excluído com sucesso!");
        onOpenChange(false);
        onSuccess?.();
      }
    } catch {
      toast("Erro ao excluir exercício.", "error");
    }
  };

  const handleDeleteAttempt = async (attemptId: string) => {
    if (!confirm("Deseja excluir esta tentativa do histórico?")) return;
    try {
      const res = await deleteExerciseAttemptAction(attemptId, subjectId);
      if (res.success) {
        toast("Tentativa removida.");
        await loadExerciseDetails();
        onSuccess?.();
      }
    } catch {
      toast("Erro ao excluir tentativa.", "error");
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Deseja remover esta foto do caderno?")) return;
    try {
      const res = await deleteAttemptAttachmentAction(photoId, subjectId);
      if (res.success) {
        toast("Foto removida.");
        await loadExerciseDetails();
      }
    } catch {
      toast("Erro ao remover foto.", "error");
    }
  };

  const openPhotoLightbox = (filePath: string, caption?: string | null, originalName?: string | null) => {
    const url = resolvedUrls[filePath] || filePath;
    setLightboxImage({ url, caption, originalName });
    setLightboxOpen(true);
  };

  if (!open || !exerciseId) return null;

  // Split attempts into latest and previous
  const attempts = exercise?.attempts || [];
  const latestAttempt = attempts.length > 0 ? attempts[0] : null;
  const previousAttempts = attempts.length > 1 ? attempts.slice(1) : [];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {exercise?.referenceNumber && (
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300 shrink-0">
                  {exercise.referenceNumber}
                </span>
              )}
              <h3 className="text-sm font-semibold text-neutral-100 truncate">
                {exercise?.title || "Carregando exercício..."}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {exercise && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onEditExercise?.(exercise);
                      onOpenChange(false);
                    }}
                    className="h-8 text-xs text-neutral-400 hover:text-white"
                    title="Editar informações"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Editar
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteExercise}
                    className="h-8 text-xs text-neutral-400 hover:text-red-400"
                    title="Excluir exercício"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-md ml-1"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
            {loading || !exercise ? (
              <div className="py-16 text-center text-neutral-400">
                Carregando detalhes do exercício...
              </div>
            ) : (
              <>
                {/* Context & Status Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-neutral-950/80 rounded-xl border border-neutral-800">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    {exercise.status === "RESOLVED" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Resolvido
                      </span>
                    )}
                    {exercise.status === "PARTIALLY_CORRECT" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Parcialmente Correto
                      </span>
                    )}
                    {exercise.status === "WRONG" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
                        <XCircle className="h-3.5 w-3.5" />
                        Errou
                      </span>
                    )}
                    {exercise.status === "REVIEW" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-800">
                        <RotateCcw className="h-3.5 w-3.5" />
                        Para Refazer
                      </span>
                    )}
                    {exercise.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-neutral-900 text-neutral-400 border border-neutral-800">
                        Pendente
                      </span>
                    )}

                    {/* Chapter Link */}
                    {exercise.topicTitle && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-900 text-neutral-300 border border-neutral-800">
                        <BookOpen className="h-3 w-3 text-neutral-400" />
                        {exercise.topicTitle}
                      </span>
                    )}

                    {/* Set Link */}
                    {exercise.exerciseSetTitle && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-950/40 text-purple-300 border border-purple-800/60">
                        <ListOrdered className="h-3 w-3 text-purple-400" />
                        {exercise.exerciseSetTitle}
                      </span>
                    )}

                    {/* Source */}
                    {exercise.source && (
                      <span className="text-neutral-400 text-[11px]">
                        Fonte: {exercise.source}
                        {exercise.sourcePage ? ` (pág. ${exercise.sourcePage})` : ""}
                      </span>
                    )}
                  </div>

                  {/* Toggle Needs Review */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleReview}
                    className={`h-7 text-xs gap-1 font-medium ${
                      exercise.needsReview
                        ? "bg-purple-950 border-purple-600 text-purple-200"
                        : "border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <RotateCcw className="h-3 w-3" />
                    {exercise.needsReview ? "Desmarcar de refazer" : "Marcar para refazer"}
                  </Button>
                </div>

                {/* 1. ENUNCIADO EM DESTAQUE */}
                <div className="space-y-3 p-4 bg-neutral-950 rounded-xl border border-neutral-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 uppercase tracking-wider">
                    <FileText className="h-3.5 w-3.5" />
                    Enunciado da Questão
                  </div>

                  {exercise.statement ? (
                    <div className="text-neutral-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                      {exercise.statement}
                    </div>
                  ) : (
                    <div className="text-neutral-500 italic text-xs">
                      Sem texto de enunciado cadastrado.
                    </div>
                  )}

                  {/* Statement Images Gallery (Large preview) */}
                  {exercise.attachments && exercise.attachments.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[11px] font-medium text-neutral-400 mb-2 flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-purple-400" />
                        Imagens do Enunciado ({exercise.attachments.length})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {exercise.attachments.map((att) => {
                          const src = resolvedUrls[att.filePath] || att.filePath;
                          return (
                            <div
                              key={att.id}
                              onClick={() => openPhotoLightbox(att.filePath, att.caption, att.originalName)}
                              className="group relative cursor-pointer border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900 hover:border-purple-500 transition-all flex flex-col"
                            >
                              <div className="max-h-64 overflow-hidden flex items-center justify-center bg-black/40">
                                <img
                                  src={src}
                                  alt={att.originalName}
                                  className="w-full h-auto object-contain max-h-64 group-hover:scale-102 transition-transform duration-200"
                                />
                              </div>
                              <div className="p-2 bg-neutral-950 border-t border-neutral-850 flex items-center justify-between text-[11px] text-neutral-300">
                                <span className="truncate">{att.caption || att.originalName}</span>
                                <ExternalLink className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. MINHA RESOLUÇÃO (FOCO PRINCIPAL) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-200 uppercase tracking-wider">
                      <Camera className="h-3.5 w-3.5 text-purple-400" />
                      Minha Resolução
                    </div>

                    <Button
                      size="sm"
                      onClick={() => setAttemptModalOpen(true)}
                      className="h-7 text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium gap-1 shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {latestAttempt ? "Nova Tentativa" : "Registrar Resolução"}
                    </Button>
                  </div>

                  {!latestAttempt ? (
                    /* Empty state: No resolution yet */
                    <div className="p-8 text-center bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-3">
                      <p className="text-neutral-400 text-xs">
                        Você ainda não resolveu este exercício.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => setAttemptModalOpen(true)}
                        className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium"
                      >
                        + Registrar Resolução
                      </Button>
                    </div>
                  ) : (
                    /* Show Latest Attempt Prominently */
                    <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                      {/* Attempt Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-200 text-xs sm:text-sm">
                            Última Resolução (Tentativa #{attempts.length})
                          </span>
                          <span className="text-[11px] text-neutral-500 font-mono">
                            {new Date(latestAttempt.attemptedAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {latestAttempt.result === "CORRECT" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Acertei
                            </span>
                          )}
                          {latestAttempt.result === "PARTIALLY_CORRECT" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-800">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Parcial
                            </span>
                          )}
                          {latestAttempt.result === "INCORRECT" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
                              <XCircle className="h-3.5 w-3.5" />
                              Errei
                            </span>
                          )}
                          {latestAttempt.result === "NOT_COMPLETED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-purple-950/80 text-purple-300 border border-purple-800">
                              <HelpCircle className="h-3.5 w-3.5" />
                              Não Consegui
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteAttempt(latestAttempt.id)}
                            className="text-neutral-500 hover:text-red-400 p-1"
                            title="Excluir tentativa"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Duration & Difficulty */}
                      {(latestAttempt.durationMinutes || latestAttempt.difficultyPerceived) && (
                        <div className="flex items-center gap-4 text-[11px] text-neutral-400">
                          {latestAttempt.durationMinutes !== null && latestAttempt.durationMinutes !== undefined && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-neutral-500" />
                              {latestAttempt.durationMinutes} min
                            </span>
                          )}

                          {latestAttempt.difficultyPerceived && (
                            <span className="flex items-center gap-1">
                              <Gauge className="h-3 w-3 text-neutral-500" />
                              Dificuldade: {latestAttempt.difficultyPerceived}/5
                            </span>
                          )}
                        </div>
                      )}

                      {/* Observations / Notes */}
                      {latestAttempt.notes && (
                        <div className="p-3 bg-neutral-900/80 rounded-lg border border-neutral-850 text-neutral-200 text-xs leading-relaxed">
                          <span className="text-[10px] text-neutral-400 font-semibold uppercase block mb-1">
                            Observação da Resolução:
                          </span>
                          {latestAttempt.notes}
                        </div>
                      )}

                      {/* Notebook Resolution Photos (Large view) */}
                      {latestAttempt.attachments && latestAttempt.attachments.length > 0 && (
                        <div className="pt-2">
                          <div className="text-[11px] font-medium text-neutral-400 mb-2 flex items-center gap-1">
                            <Camera className="h-3.5 w-3.5 text-purple-400" />
                            Fotos do Caderno ({latestAttempt.attachments.length}):
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {latestAttempt.attachments.map((photo) => {
                              const src = resolvedUrls[photo.filePath] || photo.filePath;
                              return (
                                <div
                                  key={photo.id}
                                  className="relative group border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900 flex flex-col"
                                >
                                  <div
                                    onClick={() => openPhotoLightbox(photo.filePath, photo.caption, photo.originalName)}
                                    className="max-h-72 overflow-hidden flex items-center justify-center bg-black/40 cursor-pointer"
                                  >
                                    <img
                                      src={src}
                                      alt={photo.caption || photo.originalName}
                                      className="w-full h-auto object-contain max-h-72 group-hover:scale-102 transition-transform"
                                    />
                                  </div>
                                  <div className="p-2 bg-neutral-950 border-t border-neutral-850 flex items-center justify-between text-[11px] text-neutral-300">
                                    <span className="truncate">{photo.caption || photo.originalName}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePhoto(photo.id)}
                                      className="text-neutral-500 hover:text-red-400 p-1"
                                      title="Remover foto"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. HISTÓRICO DE TENTATIVAS ANTERIORES (COLLAPSIBLE) */}
                  {previousAttempts.length > 0 && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowHistory((prev) => !prev)}
                        className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-200 text-xs font-medium py-1 transition-colors"
                      >
                        <History className="h-3.5 w-3.5 text-purple-400" />
                        <span>Histórico de tentativas anteriores ({previousAttempts.length})</span>
                        {showHistory ? (
                          <ChevronUp className="h-3.5 w-3.5 ml-1" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 ml-1" />
                        )}
                      </button>

                      {showHistory && (
                        <div className="mt-3 space-y-3">
                          {previousAttempts.map((att, idx) => {
                            const attemptNum = attempts.length - 1 - idx;
                            return (
                              <div
                                key={att.id}
                                className="p-3 bg-neutral-950/70 rounded-lg border border-neutral-800 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-neutral-300">
                                      Tentativa #{attemptNum}
                                    </span>
                                    <span className="text-[10px] text-neutral-500 font-mono">
                                      {new Date(att.attemptedAt).toLocaleDateString("pt-BR")}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {att.result === "CORRECT" && (
                                      <span className="text-[10px] font-semibold text-emerald-400">Acertei</span>
                                    )}
                                    {att.result === "PARTIALLY_CORRECT" && (
                                      <span className="text-[10px] font-semibold text-amber-400">Parcial</span>
                                    )}
                                    {att.result === "INCORRECT" && (
                                      <span className="text-[10px] font-semibold text-rose-400">Errei</span>
                                    )}
                                    {att.result === "NOT_COMPLETED" && (
                                      <span className="text-[10px] font-semibold text-purple-400">Não Conseguiu</span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAttempt(att.id)}
                                      className="text-neutral-500 hover:text-red-400 p-0.5"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>

                                {att.notes && (
                                  <p className="text-neutral-300 text-xs bg-neutral-900/60 p-2 rounded">
                                    {att.notes}
                                  </p>
                                )}

                                {att.attachments && att.attachments.length > 0 && (
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {att.attachments.map((photo) => {
                                      const src = resolvedUrls[photo.filePath] || photo.filePath;
                                      return (
                                        <img
                                          key={photo.id}
                                          src={src}
                                          alt={photo.caption || photo.originalName}
                                          onClick={() => openPhotoLightbox(photo.filePath, photo.caption, photo.originalName)}
                                          className="w-16 h-16 object-cover rounded border border-neutral-800 cursor-pointer hover:scale-105 transition-transform"
                                        />
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Attempt Register Modal */}
      {exercise && (
        <AttemptRegisterModal
          open={attemptModalOpen}
          onOpenChange={setAttemptModalOpen}
          exerciseId={exercise.id}
          exerciseTitle={exercise.title}
          subjectId={subjectId}
          onSuccess={async () => {
            await loadExerciseDetails();
            onSuccess?.();
          }}
        />
      )}

      {/* Lightbox Modal */}
      <ImageLightboxModal
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        imageUrl={lightboxImage?.url || null}
        caption={lightboxImage?.caption}
        originalName={lightboxImage?.originalName}
      />
    </>
  );
}
