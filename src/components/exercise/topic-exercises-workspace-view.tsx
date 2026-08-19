"use client";

import * as React from "react";
import {
  FileCheck,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  BookOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ExerciseItem, calculateExerciseSetProgress } from "@/domain/exercises";
import { getExercisesByTopicIdAction } from "@/actions/exercise.actions";
import { ExerciseCard } from "./exercise-card";
import { ExerciseModal } from "./exercise-modal";
import { ExerciseDetailModal } from "./exercise-detail-modal";
import { AttemptRegisterModal } from "./attempt-register-modal";

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
  const [attemptModalExercise, setAttemptModalExercise] = React.useState<ExerciseItem | null>(null);

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
    <div className="flex-1 h-full flex flex-col bg-neutral-950 overflow-y-auto p-5 space-y-4">
      {/* Header Enxuto */}
      <div className="p-3.5 bg-neutral-900/60 border border-neutral-800 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-purple-400 font-medium">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Capítulo: {topicTitle}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-neutral-400">
            <span className="font-semibold text-neutral-200">
              {progress.total} {progress.total === 1 ? "exercício" : "exercícios"}
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">{progress.resolvedCount} resolvidos</span>
            {progress.reviewCount > 0 && (
              <>
                <span>•</span>
                <span className="text-purple-400 font-medium">{progress.reviewCount} para refazer</span>
              </>
            )}
            <span>•</span>
            <span className="text-neutral-500">{progress.pendingCount} pendentes</span>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium gap-1 shrink-0 shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Novo Exercício
        </Button>
      </div>

      {/* Exercise Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-neutral-400 text-xs">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500 mx-auto mb-2" />
          Carregando exercícios do capítulo...
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
            className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Cadastrar 1° Exercício
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {exercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              onOpenDetail={(item) => setSelectedExerciseId(item.id)}
              onNewAttempt={(item) => setAttemptModalExercise(item)}
            />
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

      {/* Direct Attempt Modal */}
      {attemptModalExercise && (
        <AttemptRegisterModal
          open={!!attemptModalExercise}
          onOpenChange={(open) => !open && setAttemptModalExercise(null)}
          exerciseId={attemptModalExercise.id}
          exerciseTitle={attemptModalExercise.title}
          subjectId={subjectId}
          onSuccess={loadTopicExercises}
        />
      )}
    </div>
  );
}
