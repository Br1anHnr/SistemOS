"use client";

import * as React from "react";
import {
  ListOrdered,
  FileCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  BookOpen,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { ExerciseSetItem, ExerciseItem, calculateExerciseSetProgress } from "@/domain/exercises";
import { deleteExerciseSetAction, getExerciseSetsAction, getExercisesAction } from "@/actions/exercise.actions";
import { ExerciseSetCard } from "./exercise-set-card";
import { ExerciseSetModal } from "./exercise-set-modal";
import { ExerciseModal } from "./exercise-modal";
import { ExerciseSetDetailModal } from "./exercise-set-detail-modal";
import { ExerciseDetailModal } from "./exercise-detail-modal";

interface SubjectExercisesTabProps {
  subjectId: string;
  subjectName: string;
  topics?: { id: string; title: string }[];
  assessments?: { id: string; title: string; date?: string | null }[];
}

export function SubjectExercisesTab({
  subjectId,
  subjectName,
  topics = [],
  assessments = [],
}: SubjectExercisesTabProps) {
  const { toast } = useToast();

  const [sets, setSets] = React.useState<ExerciseSetItem[]>([]);
  const [exercises, setExercises] = React.useState<ExerciseItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  // Tab View Mode: "SETS" | "STANDALONE" | "ALL"
  const [viewMode, setViewMode] = React.useState<"SETS" | "STANDALONE" | "ALL">("SETS");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [selectedTopicFilter, setSelectedTopicFilter] = React.useState<string>("");

  // Modal States
  const [setModalOpen, setSetModalOpen] = React.useState<boolean>(false);
  const [setToEdit, setSetToEdit] = React.useState<ExerciseSetItem | null>(null);

  const [exerciseModalOpen, setExerciseModalOpen] = React.useState<boolean>(false);
  const [exerciseToEdit, setExerciseToEdit] = React.useState<ExerciseItem | null>(null);
  const [defaultSetIdForExercise, setDefaultSetIdForExercise] = React.useState<string | null>(null);

  const [activeSetDetail, setActiveSetDetail] = React.useState<ExerciseSetItem | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [setsRes, exercisesRes] = await Promise.all([
        getExerciseSetsAction(subjectId),
        getExercisesAction(subjectId),
      ]);

      if (setsRes.success && setsRes.data) {
        setSets(setsRes.data as ExerciseSetItem[]);
      }
      if (exercisesRes.success && exercisesRes.data) {
        setExercises(exercisesRes.data as ExerciseItem[]);
      }
    } catch {
      toast("Erro ao carregar exercícios da disciplina.", "error");
    } finally {
      setLoading(false);
    }
  }, [subjectId, toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteSet = async (setId: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir a lista "${title}"?`)) return;
    try {
      const res = await deleteExerciseSetAction(setId, subjectId);
      if (res.success) {
        toast("Lista excluída com sucesso!");
        await loadData();
      }
    } catch {
      toast("Erro ao excluir lista.", "error");
    }
  };

  // Overall Statistics for this Subject
  const overallProgress = React.useMemo(() => {
    return calculateExerciseSetProgress(exercises);
  }, [exercises]);

  // Filtered exercises
  const filteredExercises = React.useMemo(() => {
    return exercises.filter((ex) => {
      if (viewMode === "STANDALONE" && ex.exerciseSetId) return false;
      if (selectedTopicFilter && ex.topicId !== selectedTopicFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ex.title.toLowerCase().includes(q);
        const matchRef = ex.referenceNumber?.toLowerCase().includes(q);
        const matchTopic = ex.topicTitle?.toLowerCase().includes(q);
        const matchSet = ex.exerciseSetTitle?.toLowerCase().includes(q);
        return matchTitle || matchRef || matchTopic || matchSet;
      }
      return true;
    });
  }, [exercises, viewMode, selectedTopicFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-neutral-900/40 border border-neutral-800 rounded-xl">
          <span className="text-[11px] text-neutral-400 font-medium">Total de Exercícios</span>
          <div className="text-xl font-bold text-neutral-100 mt-1 font-mono">
            {overallProgress.total}
          </div>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">
            {sets.length} lista(s) cadastradas
          </span>
        </div>

        <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/40 rounded-xl">
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Taxa de Resolução
          </span>
          <div className="text-xl font-bold text-emerald-300 mt-1 font-mono">
            {overallProgress.progressPercentage}%
          </div>
          <span className="text-[10px] text-emerald-400/70 mt-0.5 block">
            {overallProgress.resolvedCount} de {overallProgress.total} resolvidos
          </span>
        </div>

        <div className="p-3.5 bg-purple-950/20 border border-purple-900/40 rounded-xl">
          <span className="text-[11px] text-purple-400 font-medium flex items-center gap-1">
            <RotateCcw className="h-3 w-3" />
            Para Refazer
          </span>
          <div className="text-xl font-bold text-purple-300 mt-1 font-mono">
            {overallProgress.reviewCount}
          </div>
          <span className="text-[10px] text-purple-400/70 mt-0.5 block">
            Marcados para revisão
          </span>
        </div>

        <div className="p-3.5 bg-neutral-900/40 border border-neutral-800 rounded-xl">
          <span className="text-[11px] text-neutral-400 font-medium">Pendentes</span>
          <div className="text-xl font-bold text-neutral-200 mt-1 font-mono">
            {overallProgress.pendingCount}
          </div>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">
            Ainda não resolvidos
          </span>
        </div>
      </div>

      {/* Action Controls & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-neutral-850">
        {/* Left View Switcher */}
        <div className="flex items-center rounded-lg bg-neutral-950 p-1 border border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => setViewMode("SETS")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              viewMode === "SETS"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Listas ({sets.length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode("STANDALONE")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              viewMode === "STANDALONE"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Avulsos ({exercises.filter((e) => !e.exerciseSetId).length})
          </button>
          <button
            type="button"
            onClick={() => setViewMode("ALL")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              viewMode === "ALL"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Todos ({exercises.length})
          </button>
        </div>

        {/* Right CTA Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSetToEdit(null);
              setSetModalOpen(true);
            }}
            className="text-xs border-purple-800/80 text-purple-300 hover:bg-purple-950/40"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Nova Lista
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setExerciseToEdit(null);
              setDefaultSetIdForExercise(null);
              setExerciseModalOpen(true);
            }}
            className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Novo Exercício
          </Button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <Input
            placeholder="Buscar por título, número (ex: Q01) ou capítulo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-neutral-950 border-neutral-800 text-xs pl-9 h-9 text-neutral-200"
          />
        </div>

        {topics.length > 0 && (
          <div className="w-full sm:w-64 shrink-0">
            <select
              value={selectedTopicFilter}
              onChange={(e) => setSelectedTopicFilter(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500 h-9"
            >
              <option value="">Filtrar por Capítulo (Todos)</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-12 text-center text-neutral-400 text-xs">
          Carregando exercícios de {subjectName}...
        </div>
      ) : viewMode === "SETS" ? (
        /* Listas View */
        sets.length === 0 ? (
          <div className="p-12 text-center bg-neutral-950/40 border border-neutral-800 rounded-xl space-y-3">
            <ListOrdered className="h-8 w-8 text-neutral-500 mx-auto" />
            <h4 className="text-sm font-semibold text-neutral-200">
              Nenhuma lista de exercícios cadastrada
            </h4>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Crie listas como &quot;Lista para P1&quot; ou &quot;Lista 01&quot; e anexe o PDF do professor.
            </p>
            <Button
              size="sm"
              onClick={() => {
                setSetToEdit(null);
                setSetModalOpen(true);
              }}
              className="text-xs bg-purple-600 hover:bg-purple-500 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Criar 1ª Lista
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sets.map((s) => (
              <ExerciseSetCard
                key={s.id}
                set={s}
                onOpenSet={(item) => setActiveSetDetail(item)}
                onEditSet={(item) => {
                  setSetToEdit(item);
                  setSetModalOpen(true);
                }}
                onDeleteSet={handleDeleteSet}
              />
            ))}
          </div>
        )
      ) : (
        /* Standalone / All Exercises List View */
        filteredExercises.length === 0 ? (
          <div className="p-12 text-center bg-neutral-950/40 border border-neutral-800 rounded-xl space-y-3">
            <FileCheck className="h-8 w-8 text-neutral-500 mx-auto" />
            <h4 className="text-sm font-semibold text-neutral-200">
              Nenhum exercício encontrado
            </h4>
            <p className="text-xs text-neutral-400">
              {searchQuery ? "Nenhum resultado para a busca atual." : "Cadastre exercícios avulsos ou vincule-os a capítulos."}
            </p>
            <Button
              size="sm"
              onClick={() => {
                setExerciseToEdit(null);
                setExerciseModalOpen(true);
              }}
              className="text-xs bg-purple-600 hover:bg-purple-500 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Cadastrar Exercício
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredExercises.map((ex, idx) => (
              <div
                key={ex.id}
                onClick={() => setSelectedExerciseId(ex.id)}
                className="flex items-center justify-between p-3.5 bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 rounded-xl cursor-pointer transition-all group shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="font-mono text-neutral-500 text-xs w-6 shrink-0">
                    {idx + 1}.
                  </span>

                  {ex.referenceNumber && (
                    <Badge variant="outline" className="font-mono text-xs border-purple-800/80 text-purple-300 shrink-0">
                      {ex.referenceNumber}
                    </Badge>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-neutral-100 group-hover:text-purple-300 transition-colors text-xs truncate">
                        {ex.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400 flex-wrap">
                      {ex.topicTitle && (
                        <span className="flex items-center gap-1 text-neutral-400">
                          <BookOpen className="h-3 w-3 text-neutral-500" />
                          {ex.topicTitle}
                        </span>
                      )}

                      {ex.exerciseSetTitle && (
                        <span className="flex items-center gap-1 text-purple-300">
                          • {ex.exerciseSetTitle}
                        </span>
                      )}

                      {ex.attempts && ex.attempts.length > 0 && (
                        <span className="text-neutral-500">
                          • {ex.attempts.length} tentativa(s)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {ex.status === "RESOLVED" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                      <CheckCircle2 className="h-3 w-3" />
                      Resolvido
                    </span>
                  )}
                  {ex.status === "PARTIALLY_CORRECT" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-medium bg-amber-950/80 text-amber-300 border border-amber-800">
                      <AlertTriangle className="h-3 w-3" />
                      Parcial
                    </span>
                  )}
                  {ex.status === "WRONG" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-medium bg-rose-950/80 text-rose-300 border border-rose-800">
                      <XCircle className="h-3 w-3" />
                      Errado
                    </span>
                  )}
                  {ex.status === "REVIEW" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-medium bg-purple-950/80 text-purple-300 border border-purple-800">
                      <RotateCcw className="h-3 w-3" />
                      Refazer
                    </span>
                  )}
                  {ex.status === "PENDING" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-medium bg-neutral-900 text-neutral-400 border border-neutral-800">
                      Pendente
                    </span>
                  )}

                  <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-purple-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal 1: Create / Edit Exercise Set (Lista) */}
      <ExerciseSetModal
        open={setModalOpen}
        onOpenChange={setSetModalOpen}
        subjectId={subjectId}
        setToEdit={setToEdit}
        assessmentsList={assessments}
        onSuccess={loadData}
      />

      {/* Modal 2: Create / Edit Exercise */}
      <ExerciseModal
        open={exerciseModalOpen}
        onOpenChange={setExerciseModalOpen}
        subjectId={subjectId}
        exerciseToEdit={exerciseToEdit}
        defaultExerciseSetId={defaultSetIdForExercise}
        topicsList={topics}
        exerciseSetsList={sets}
        onSuccess={loadData}
      />

      {/* Modal 3: Exercise Set Detail (Questions inside Set) */}
      <ExerciseSetDetailModal
        open={!!activeSetDetail}
        onOpenChange={(open) => !open && setActiveSetDetail(null)}
        set={activeSetDetail}
        exercises={exercises}
        onOpenExercise={(ex) => setSelectedExerciseId(ex.id)}
        onAddExerciseToSet={(setId) => {
          setExerciseToEdit(null);
          setDefaultSetIdForExercise(setId);
          setExerciseModalOpen(true);
        }}
      />

      {/* Modal 4: Exercise Detail & Attempt Timeline View */}
      <ExerciseDetailModal
        open={!!selectedExerciseId}
        onOpenChange={(open) => !open && setSelectedExerciseId(null)}
        exerciseId={selectedExerciseId}
        subjectId={subjectId}
        onEditExercise={(ex) => {
          setExerciseToEdit(ex);
          setExerciseModalOpen(true);
        }}
        onSuccess={loadData}
      />
    </div>
  );
}
