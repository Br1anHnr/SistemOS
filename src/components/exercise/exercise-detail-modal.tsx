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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { ExerciseItem } from "@/domain/exercises";
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

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {exercise?.referenceNumber && (
                <Badge variant="outline" className="font-mono text-xs border-purple-800 text-purple-300">
                  {exercise.referenceNumber}
                </Badge>
              )}
              <h3 className="text-base font-semibold text-neutral-100 truncate">
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
                className="text-neutral-400 hover:text-white p-1 rounded-md ml-2"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
            {loading || !exercise ? (
              <div className="py-12 text-center text-neutral-400">
                Carregando detalhes do exercício...
              </div>
            ) : (
              <>
                {/* Context Badges & Status Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-neutral-950/80 rounded-lg border border-neutral-800">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    {exercise.status === "RESOLVED" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        Resolvido
                      </span>
                    )}
                    {exercise.status === "PARTIALLY_CORRECT" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800">
                        <AlertTriangle className="h-3 w-3" />
                        Parcial
                      </span>
                    )}
                    {exercise.status === "WRONG" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/60 text-rose-300 border border-rose-800">
                        <XCircle className="h-3 w-3" />
                        Errou
                      </span>
                    )}
                    {exercise.status === "REVIEW" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-950/60 text-purple-300 border border-purple-800">
                        <RotateCcw className="h-3 w-3" />
                        Para Refazer
                      </span>
                    )}
                    {exercise.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-900 text-neutral-400 border border-neutral-800">
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-900 text-neutral-300 border border-neutral-800">
                        <ListOrdered className="h-3 w-3 text-neutral-400" />
                        {exercise.exerciseSetTitle}
                      </span>
                    )}

                    {/* Assessment Link */}
                    {exercise.assessmentTitle && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-950/40 text-blue-300 border border-blue-800/60">
                        <Calendar className="h-3 w-3 text-blue-400" />
                        {exercise.assessmentTitle}
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
                    {exercise.needsReview ? "Marcado para refazer" : "Marcar para refazer"}
                  </Button>
                </div>

                {/* Problem Statement Area */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                    Enunciado da Questão
                  </div>
                  {exercise.statement ? (
                    <div className="p-3.5 bg-neutral-950 rounded-lg border border-neutral-800 text-neutral-200 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                      {exercise.statement}
                    </div>
                  ) : (
                    <div className="p-3 bg-neutral-950/40 rounded-lg border border-neutral-800/80 text-neutral-500 italic text-xs">
                      Nenhum texto de enunciado cadastrado.
                    </div>
                  )}

                  {/* Statement Images Gallery */}
                  {exercise.attachments && exercise.attachments.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[11px] font-medium text-neutral-400 mb-1.5 flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        Imagens do Enunciado ({exercise.attachments.length})
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {exercise.attachments.map((att) => {
                          const src = resolvedUrls[att.filePath] || att.filePath;
                          return (
                            <div
                              key={att.id}
                              onClick={() => openPhotoLightbox(att.filePath, att.caption, att.originalName)}
                              className="group relative cursor-pointer border border-neutral-800 rounded-lg overflow-hidden bg-neutral-950 hover:border-purple-500 transition-all aspect-video flex flex-col"
                            >
                              <img
                                src={src}
                                alt={att.originalName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <ExternalLink className="h-4 w-4" />
                              </div>
                              {att.caption && (
                                <div className="absolute bottom-0 inset-x-0 bg-black/75 p-1 text-[10px] text-neutral-200 truncate">
                                  {att.caption}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Attempts Timeline History */}
                <div className="pt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      Histórico de Tentativas ({exercise.attempts?.length || 0})
                    </div>

                    <Button
                      size="sm"
                      onClick={() => setAttemptModalOpen(true)}
                      className="h-7 text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Registrar Tentativa
                    </Button>
                  </div>

                  {(!exercise.attempts || exercise.attempts.length === 0) ? (
                    <div className="p-6 text-center bg-neutral-950/40 rounded-lg border border-neutral-800/80">
                      <p className="text-neutral-400 text-xs">
                        Nenhuma tentativa registrada ainda.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAttemptModalOpen(true)}
                        className="mt-3 text-xs border-purple-800 text-purple-300 hover:bg-purple-950/40"
                      >
                        + Registrar 1ª Tentativa
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {exercise.attempts.map((att, idx) => {
                        const attemptNum = exercise.attempts!.length - idx;
                        const dateStr = new Date(att.attemptedAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <div
                            key={att.id}
                            className="p-3.5 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2.5"
                          >
                            {/* Attempt Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-neutral-200">
                                  Tentativa #{attemptNum}
                                </span>
                                <span className="text-[11px] text-neutral-500 font-mono">
                                  {dateStr}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {att.result === "CORRECT" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Correto
                                  </span>
                                )}
                                {att.result === "PARTIALLY_CORRECT" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950/80 text-amber-300 border border-amber-800">
                                    <AlertTriangle className="h-3 w-3" />
                                    Parcial
                                  </span>
                                )}
                                {att.result === "INCORRECT" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-950/80 text-rose-300 border border-rose-800">
                                    <XCircle className="h-3 w-3" />
                                    Errado
                                  </span>
                                )}
                                {att.result === "NOT_COMPLETED" && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-950/80 text-purple-300 border border-purple-800">
                                    <HelpCircle className="h-3 w-3" />
                                    Não Conseguiu
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttempt(att.id)}
                                  className="text-neutral-500 hover:text-red-400 p-1 transition-colors"
                                  title="Excluir tentativa"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>

                            {/* Duration & Difficulty */}
                            <div className="flex items-center gap-4 text-[11px] text-neutral-400">
                              {att.durationMinutes !== null && att.durationMinutes !== undefined && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-neutral-500" />
                                  {att.durationMinutes} min
                                </span>
                              )}

                              {att.difficultyPerceived && (
                                <span className="flex items-center gap-1">
                                  <Gauge className="h-3 w-3 text-neutral-500" />
                                  Dificuldade: {att.difficultyPerceived}/5
                                </span>
                              )}

                              {att.needsReview && (
                                <span className="text-amber-400 font-medium">
                                  • Marcado para refazer
                                </span>
                              )}
                            </div>

                            {/* Attempt Notes */}
                            {att.notes && (
                              <p className="text-neutral-300 text-xs bg-neutral-900/60 p-2 rounded border border-neutral-850">
                                {att.notes}
                              </p>
                            )}

                            {/* Notebook Photos Gallery */}
                            {att.attachments && att.attachments.length > 0 && (
                              <div className="pt-1">
                                <div className="text-[10px] font-medium text-neutral-400 mb-1.5">
                                  Fotos da Resolução no Caderno ({att.attachments.length}):
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {att.attachments.map((photo) => {
                                    const src = resolvedUrls[photo.filePath] || photo.filePath;
                                    return (
                                      <div
                                        key={photo.id}
                                        className="relative group border border-neutral-800 rounded-md overflow-hidden bg-neutral-900 w-24 h-24"
                                      >
                                        <img
                                          src={src}
                                          alt={photo.caption || photo.originalName}
                                          onClick={() => openPhotoLightbox(photo.filePath, photo.caption, photo.originalName)}
                                          className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleDeletePhoto(photo.id)}
                                          className="absolute top-1 right-1 p-1 bg-black/80 rounded text-neutral-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Remover foto"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                        {photo.caption && (
                                          <div className="absolute bottom-0 inset-x-0 bg-black/80 p-0.5 text-[9px] text-neutral-200 text-center truncate">
                                            {photo.caption}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
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
