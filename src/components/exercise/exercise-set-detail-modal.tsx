"use client";

import * as React from "react";
import {
  Award,
  Calendar,
  FileText,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  BookOpen,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExerciseSetItem, ExerciseItem } from "@/domain/exercises";
import { getLocalFileUrl } from "@/lib/file-storage";
import { ExerciseCard } from "./exercise-card";

interface ExerciseSetDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  set: ExerciseSetItem | null;
  exercises: ExerciseItem[];
  onOpenExercise: (exercise: ExerciseItem) => void;
  onAddExerciseToSet: (setId: string) => void;
}

export function ExerciseSetDetailModal({
  open,
  onOpenChange,
  set,
  exercises,
  onOpenExercise,
  onAddExerciseToSet,
}: ExerciseSetDetailModalProps) {
  const [resolvedFileUrl, setResolvedFileUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function resolveUrl() {
      if (set?.sourceFileUrl) {
        const url = await getLocalFileUrl(set.sourceFileUrl);
        setResolvedFileUrl(url);
      } else {
        setResolvedFileUrl(null);
      }
    }
    resolveUrl();
  }, [set]);

  if (!open || !set) return null;

  const setExercises = exercises.filter((e) => e.exerciseSetId === set.id);
  const progress = set.progress || {
    total: setExercises.length,
    triedCount: 0,
    resolvedCount: 0,
    partialCount: 0,
    wrongCount: 0,
    reviewCount: 0,
    pendingCount: 0,
    progressPercentage: 0,
    successRate: 0,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-neutral-100 truncate">
              {set.title}
            </h3>
            {set.description && (
              <p className="text-xs text-neutral-400 mt-0.5">{set.description}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-neutral-400 hover:text-white p-1 rounded-md ml-3"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Metadata & Progress Header */}
          <div className="p-3.5 bg-neutral-950 rounded-lg border border-neutral-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {set.assessmentTitle && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-blue-950/60 text-blue-300 border border-blue-800">
                    <Award className="h-3.5 w-3.5 text-blue-400" />
                    Avaliação: {set.assessmentTitle}
                    {set.assessmentDate ? ` • ${set.assessmentDate}` : ""}
                  </span>
                )}

                {set.dueDate && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-neutral-900 text-neutral-300 border border-neutral-800">
                    <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                    Prazo: {set.dueDate}
                  </span>
                )}
              </div>

              {/* Source File Download / View */}
              {set.sourceFileName && resolvedFileUrl && (
                <a
                  href={resolvedFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  download={set.sourceFileName}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-purple-950 text-purple-300 border border-purple-800 hover:bg-purple-900/50 transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>{set.sourceFileName}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {/* Progress Bar & Breakdown */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-neutral-400">
                  Progresso: {progress.resolvedCount} de {progress.total} resolvidos
                </span>
                <span className="font-mono text-purple-300 font-semibold">
                  {progress.progressPercentage}% concluído
                </span>
              </div>

              <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{
                    width: `${progress.total > 0 ? (progress.resolvedCount / progress.total) * 100 : 0}%`,
                  }}
                />
                <div
                  className="bg-amber-500 h-full transition-all"
                  style={{
                    width: `${progress.total > 0 ? (progress.partialCount / progress.total) * 100 : 0}%`,
                  }}
                />
                <div
                  className="bg-purple-500 h-full transition-all"
                  style={{
                    width: `${progress.total > 0 ? (progress.reviewCount / progress.total) * 100 : 0}%`,
                  }}
                />
                <div
                  className="bg-rose-500 h-full transition-all"
                  style={{
                    width: `${progress.total > 0 ? (progress.wrongCount / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>

              <div className="flex items-center gap-3 mt-2 text-[11px] text-neutral-400">
                <span className="text-emerald-400 font-medium">{progress.resolvedCount} resolvidos</span>
                {progress.partialCount > 0 && <span className="text-amber-400 font-medium">{progress.partialCount} parciais</span>}
                {progress.reviewCount > 0 && <span className="text-purple-400 font-medium">{progress.reviewCount} para refazer</span>}
                {progress.wrongCount > 0 && <span className="text-rose-400 font-medium">{progress.wrongCount} errados</span>}
                <span className="text-neutral-500">{progress.pendingCount} pendentes</span>
              </div>
            </div>
          </div>

          {/* Exercises List in this Set */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                Questões da Lista ({setExercises.length})
              </h4>
              <Button
                size="sm"
                onClick={() => onAddExerciseToSet(set.id)}
                className="h-7 text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Questão
              </Button>
            </div>

            {setExercises.length === 0 ? (
              <div className="p-8 text-center bg-neutral-950/40 rounded-lg border border-neutral-800/80">
                <p className="text-neutral-400 text-xs">
                  Nenhum exercício cadastrado nesta lista ainda.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddExerciseToSet(set.id)}
                  className="mt-3 text-xs border-purple-800 text-purple-300 hover:bg-purple-950/40"
                >
                  + Cadastrar 1ª Questão
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {setExercises.map((ex) => (
                  <ExerciseCard
                    key={ex.id}
                    exercise={ex}
                    onOpenDetail={(item) => onOpenExercise(item)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
