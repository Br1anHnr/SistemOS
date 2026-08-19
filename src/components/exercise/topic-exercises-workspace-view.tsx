"use client";

import * as React from "react";
import {
  FileCheck,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  ChevronRight,
  BookOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { ExerciseItem, calculateExerciseSetProgress } from "@/domain/exercises";
import { getExercisesByTopicIdAction } from "@/actions/exercise.actions";
import { ExerciseModal } from "./exercise-modal";
import { ExerciseDetailModal } from "./exercise-detail-modal";

interface TopicExercisesWorkspaceViewProps {
  topicId: string;
  topicTitle: string;
  subjectId?: string;
}

export function TopicExercisesWorkspaceView({
  topicId,
  topicTitle,
  subjectId = "",
}: TopicExercisesWorkspaceViewProps) {
  const { toast } = useToast();

  const [exercises, setExercises] = React.useState<ExerciseItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  const [createModalOpen, setCreateModalOpen] = React.useState<boolean>(false);
  const [selectedExerciseId, setSelectedExerciseId] = React.useState<string | null>(null);

  const loadTopicExercises = React.useCallback(async () => {
    if (!topicId || !subjectId) return;
    setLoading(true);
    try {
      const res = await getExercisesByTopicIdAction(topicId, subjectId);
      if (res.success && res.data) {
        setExercises(res.data as ExerciseItem[]);
      }
    } catch {
      toast("Erro ao carregar exercícios do capítulo.", "error");
    } finally {
      setLoading(false);
    }
  }, [topicId, subjectId, toast]);

  React.useEffect(() => {
    loadTopicExercises();
  }, [loadTopicExercises]);

  const progress = React.useMemo(() => {
    return calculateExerciseSetProgress(exercises);
  }, [exercises]);

  return (
    <div className="flex-1 h-full flex flex-col bg-neutral-950/80 overflow-y-auto p-6 space-y-5">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl">
        <div>
          <div className="flex items-center gap-2 text-xs text-purple-400 font-medium mb-1">
            <BookOpen className="h-3.5 w-3.5" />
            Exercícios do Capítulo
          </div>
          <h3 className="text-base font-bold text-neutral-100">{topicTitle}</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            {progress.total} {progress.total === 1 ? "exercício cadastrado" : "exercícios cadastrados"} • {progress.resolvedCount} resolvidos ({progress.progressPercentage}%)
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium gap-1 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo Exercício
        </Button>
      </div>

      {/* Progress Breakdown */}
      {progress.total > 0 && (
        <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all"
            style={{
              width: `${(progress.resolvedCount / progress.total) * 100}%`,
            }}
          />
          <div
            className="bg-amber-500 h-full transition-all"
            style={{
              width: `${(progress.partialCount / progress.total) * 100}%`,
            }}
          />
          <div
            className="bg-purple-500 h-full transition-all"
            style={{
              width: `${(progress.reviewCount / progress.total) * 100}%`,
            }}
          />
          <div
            className="bg-rose-500 h-full transition-all"
            style={{
              width: `${(progress.wrongCount / progress.total) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Exercise List */}
      {loading ? (
        <div className="py-12 text-center text-neutral-400 text-xs">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500 mx-auto mb-2" />
          Carregando exercícios...
        </div>
      ) : exercises.length === 0 ? (
        <div className="p-12 text-center bg-neutral-900/30 border border-neutral-800/80 rounded-xl space-y-3">
          <FileCheck className="h-8 w-8 text-neutral-500 mx-auto" />
          <h4 className="text-sm font-semibold text-neutral-200">
            Nenhum exercício vinculado a este capítulo
          </h4>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Cadastre questões de fixação para treinar e consolidar os conceitos deste capítulo.
          </p>
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="text-xs bg-purple-600 hover:bg-purple-500 text-white"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Cadastrar 1° Exercício
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {exercises.map((ex, idx) => (
            <div
              key={ex.id}
              onClick={() => setSelectedExerciseId(ex.id)}
              className="flex items-center justify-between p-3.5 bg-neutral-900/70 hover:bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 rounded-xl cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="font-mono text-neutral-500 text-xs w-5 shrink-0">
                  {idx + 1}.
                </span>

                {ex.referenceNumber && (
                  <Badge variant="outline" className="font-mono text-[10px] border-purple-800 text-purple-300 shrink-0">
                    {ex.referenceNumber}
                  </Badge>
                )}

                <div className="min-w-0 flex-1">
                  <span className="font-medium text-neutral-200 group-hover:text-purple-300 transition-colors text-xs truncate block">
                    {ex.title}
                  </span>

                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500">
                    {ex.exerciseSetTitle && (
                      <span className="text-purple-300/80">
                        {ex.exerciseSetTitle}
                      </span>
                    )}
                    {ex.attempts && ex.attempts.length > 0 && (
                      <span>• {ex.attempts.length} tentativa(s)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {ex.status === "RESOLVED" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                    <CheckCircle2 className="h-3 w-3" />
                    Resolvido
                  </span>
                )}
                {ex.status === "PARTIALLY_CORRECT" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950/80 text-amber-300 border border-amber-800">
                    <AlertTriangle className="h-3 w-3" />
                    Parcial
                  </span>
                )}
                {ex.status === "WRONG" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-950/80 text-rose-300 border border-rose-800">
                    <XCircle className="h-3 w-3" />
                    Errado
                  </span>
                )}
                {ex.status === "REVIEW" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-950/80 text-purple-300 border border-purple-800">
                    <RotateCcw className="h-3 w-3" />
                    Refazer
                  </span>
                )}
                {ex.status === "PENDING" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-900 text-neutral-400 border border-neutral-800">
                    Pendente
                  </span>
                )}

                <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-purple-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exercise Creation Modal scoped to this topic */}
      <ExerciseModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        subjectId={subjectId}
        defaultTopicId={topicId}
        topicsList={[{ id: topicId, title: topicTitle }]}
        onSuccess={loadTopicExercises}
      />

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        open={!!selectedExerciseId}
        onOpenChange={(open) => !open && setSelectedExerciseId(null)}
        exerciseId={selectedExerciseId}
        subjectId={subjectId}
        onSuccess={loadTopicExercises}
      />
    </div>
  );
}
