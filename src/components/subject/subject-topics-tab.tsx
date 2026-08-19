"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  calculateTopicProgress,
  calculateMasteryAverage,
  calculateMasteryDistribution,
  calculateEstimatedRemainingStudyHours,
  MASTERY_LEVELS,
  TopicItem,
} from "@/domain/topics";
import {
  updateTopicMasteryAction,
  toggleTopicCompleteAction,
  deleteTopicAction,
  reorderTopicsAction,
} from "@/actions/topic.actions";
import { TopicModal } from "@/components/topic/topic-modal";
import { BatchTopicModal } from "@/components/topic/batch-topic-modal";
import { useToast } from "@/components/ui/toast";
import {
  FileText,
  Plus,
  Wand2,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Flame,
  Award,
  Filter,
} from "lucide-react";
import { useRouter } from "next/navigation";

export interface TopicWithAssessment extends TopicItem {
  id: string;
  subjectId: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  masteryLevel: number;
  importance: number;
  estimatedHours?: number | null;
  status: "NOT_STARTED" | "IN_PROGRESS" | "REVIEWED" | "COMPLETED" | "ARCHIVED";
  assessmentId?: string | null;
  assessmentTitle?: string | null;
  completedAt?: Date | string | null;
}

export function SubjectTopicsTab({
  subjectId,
  subjectName,
  subjectCode,
  topics = [],
  assessments = [],
}: {
  subjectId: string;
  subjectName?: string | null;
  subjectCode?: string | null;
  topics?: TopicWithAssessment[];
  assessments?: Array<{ id: string; title: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [topicModalOpen, setTopicModalOpen] = React.useState(false);
  const [batchModalOpen, setBatchModalOpen] = React.useState(false);
  const [editingTopic, setEditingTopic] = React.useState<TopicWithAssessment | null>(null);

  const [statusFilter, setStatusFilter] = React.useState<
    "ALL" | "PENDING" | "COMPLETED"
  >("ALL");
  const [assessmentFilter, setAssessmentFilter] = React.useState<string>("ALL");

  // Domain calculations
  const progress = React.useMemo(() => calculateTopicProgress(topics), [topics]);
  const mastery = React.useMemo(() => calculateMasteryAverage(topics), [topics]);
  const distribution = React.useMemo(
    () => calculateMasteryDistribution(topics),
    [topics]
  );
  const remainingHours = React.useMemo(
    () => calculateEstimatedRemainingStudyHours(topics),
    [topics]
  );

  // Filtered topics
  const filteredTopics = React.useMemo(() => {
    return topics.filter((t) => {
      if (t.status === "ARCHIVED") return false;

      if (statusFilter === "PENDING" && (t.status === "COMPLETED" || t.masteryLevel === 4)) {
        return false;
      }
      if (statusFilter === "COMPLETED" && t.status !== "COMPLETED" && t.masteryLevel !== 4) {
        return false;
      }

      if (assessmentFilter !== "ALL") {
        if (assessmentFilter === "NONE" && t.assessmentId) return false;
        if (assessmentFilter !== "NONE" && t.assessmentId !== assessmentFilter) return false;
      }

      return true;
    });
  }, [topics, statusFilter, assessmentFilter]);

  const handleMasteryChange = async (topicId: string, level: number) => {
    try {
      const res = await updateTopicMasteryAction(topicId, subjectId, level);
      if (res.success) {
        router.refresh();
      } else {
        toast(res.error || "Erro ao atualizar domínio.", "error");
      }
    } catch {
      toast("Erro ao atualizar nível de domínio.", "error");
    }
  };

  const handleToggleComplete = async (topic: TopicWithAssessment) => {
    const isCompleted = topic.status === "COMPLETED" || topic.masteryLevel === 4;
    try {
      const res = await toggleTopicCompleteAction(
        topic.id,
        subjectId,
        !isCompleted
      );
      if (res.success) {
        toast(!isCompleted ? "Tópico marcado como dominado!" : "Tópico reaberto.");
        router.refresh();
      } else {
        toast(res.error || "Erro ao alterar conclusão.", "error");
      }
    } catch {
      toast("Erro ao alterar status.", "error");
    }
  };

  const handleMove = async (index: number, direction: "UP" | "DOWN") => {
    if (direction === "UP" && index === 0) return;
    if (direction === "DOWN" && index === topics.length - 1) return;

    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    const current = topics[index];
    const target = topics[targetIndex];

    const reordered = [
      { id: current.id, orderIndex: target.orderIndex },
      { id: target.id, orderIndex: current.orderIndex },
    ];

    try {
      const res = await reorderTopicsAction(subjectId, reordered);
      if (res.success) {
        router.refresh();
      }
    } catch {
      toast("Erro ao reordenar.", "error");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Deseja excluir o conteúdo "${title}"?`)) return;
    try {
      const res = await deleteTopicAction(id, subjectId);
      if (res.success) {
        toast("Conteúdo excluído.");
        router.refresh();
      } else {
        toast(res.error || "Erro ao excluir.", "error");
      }
    } catch {
      toast("Erro ao remover conteúdo.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Progress Card */}
        <Card className="border-neutral-800 bg-neutral-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Progresso da Ementa</span>
            <FileText className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-neutral-100">
              {progress.progressPercentage}%
            </span>
            <span className="text-xs text-neutral-400">
              ({progress.completedCount}/{progress.total} tópicos dominados)
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden mt-3 border border-neutral-850">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress.progressPercentage}%` }}
            />
          </div>
        </Card>

        {/* Mastery Card */}
        <Card className="border-neutral-800 bg-neutral-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Nível Médio de Domínio</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-neutral-100">
              {mastery.averageLevel.toFixed(1)}
            </span>
            <span className="text-xs text-neutral-400">/ 4.0 ({mastery.masteryScore}%)</span>
          </div>

          {/* Mini Distribution Bar */}
          <div className="flex gap-1 mt-3">
            {MASTERY_LEVELS.map((lvl) => {
              const count = distribution[lvl.level] || 0;
              return (
                <div
                  key={lvl.level}
                  className={`flex-1 text-center py-0.5 rounded text-[10px] font-mono border ${lvl.color}`}
                  title={`${lvl.label}: ${count} tópico(s)`}
                >
                  {count}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Estimated Hours Card */}
        <Card className="border-neutral-800 bg-neutral-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Tempo Estimado Restante</span>
            <Clock className="h-4 w-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-neutral-100">
              {remainingHours > 0 ? `${remainingHours}h` : "—"}
            </span>
            <span className="text-xs text-neutral-400">
              {remainingHours > 0 ? "de estudo previsto" : "nenhuma hora estimada"}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-neutral-400">
            {progress.inProgressCount} tópico(s) em estudo ativo
          </div>
        </Card>
      </div>

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100">
            Tópicos & Ementa da Disciplina ({topics.length})
          </h3>
          <p className="text-xs text-neutral-400">
            Acompanhe o nível de domínio (0 a 4) de cada conteúdo e organize suas revisões.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setBatchModalOpen(true)}
            className="text-xs border-neutral-750"
          >
            <Wand2 className="h-3.5 w-3.5 mr-1.5 text-purple-400" />
            Importar Ementa
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setEditingTopic(null);
              setTopicModalOpen(true);
            }}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Novo Conteúdo
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      {topics.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg bg-neutral-950/60 border border-neutral-850 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-neutral-400 font-medium flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-neutral-500" />
              Filtro:
            </span>
            <div className="flex rounded-md bg-neutral-900 border border-neutral-800 p-0.5">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  statusFilter === "ALL"
                    ? "bg-neutral-800 text-white font-medium"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Todos ({topics.length})
              </button>
              <button
                onClick={() => setStatusFilter("PENDING")}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  statusFilter === "PENDING"
                    ? "bg-neutral-800 text-white font-medium"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Pendentes ({progress.total - progress.completedCount})
              </button>
              <button
                onClick={() => setStatusFilter("COMPLETED")}
                className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                  statusFilter === "COMPLETED"
                    ? "bg-neutral-800 text-white font-medium"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Dominados ({progress.completedCount})
              </button>
            </div>
          </div>

          {assessments.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400 text-[11px]">Prova:</span>
              <select
                value={assessmentFilter}
                onChange={(e) => setAssessmentFilter(e.target.value)}
                className="h-7 text-xs bg-neutral-900 border border-neutral-800 rounded px-2 text-neutral-200"
              >
                <option value="ALL">Todas as Avaliações</option>
                <option value="NONE">Sem Avaliação Vinculada</option>
                {assessments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Topics List */}
      {topics.length === 0 ? (
        <div className="p-8 rounded-lg border border-dashed border-neutral-800 text-center space-y-3">
          <FileText className="h-8 w-8 text-neutral-500 mx-auto" />
          <h4 className="text-sm font-semibold text-neutral-200">
            Nenhum conteúdo cadastrado
          </h4>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Cadastre os tópicos da matéria para acompanhar o que já estudou e o nível de domínio em cada assunto.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBatchModalOpen(true)}
            >
              <Wand2 className="h-3.5 w-3.5 mr-1" />
              Importar Ementa
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingTopic(null);
                setTopicModalOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Adicionar Tópico
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTopics.map((topic, index) => {
            const isCompleted =
              topic.status === "COMPLETED" || topic.masteryLevel === 4;

            return (
              <div
                key={topic.id}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border transition-colors ${
                  isCompleted
                    ? "bg-emerald-950/10 border-emerald-900/30"
                    : topic.masteryLevel > 0
                    ? "bg-neutral-900/40 border-neutral-800"
                    : "bg-neutral-950/60 border-neutral-850"
                }`}
              >
                {/* Left: Checkbox + Title + Metadata */}
                <div className="flex items-start gap-3">
                  {/* Complete Checkbox */}
                  <button
                    onClick={() => handleToggleComplete(topic)}
                    className="mt-0.5 text-neutral-500 hover:text-emerald-400 transition-colors shrink-0"
                    title={isCompleted ? "Desmarcar conclusão" : "Marcar como dominado"}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Circle className="h-5 w-5 text-neutral-600 hover:text-neutral-400" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-medium ${
                          isCompleted
                            ? "text-neutral-300 line-through decoration-neutral-600"
                            : "text-neutral-100"
                        }`}
                      >
                        {topic.title}
                      </span>

                      {topic.assessmentTitle && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono text-blue-400 border-blue-800"
                        >
                          <Award className="h-3 w-3 mr-1" />
                          {topic.assessmentTitle}
                        </Badge>
                      )}

                      {topic.importance >= 4 && (
                        <span
                          className="flex items-center text-amber-400 text-[10px] font-mono"
                          title={`Importância: ${topic.importance}/5`}
                        >
                          <Flame className="h-3 w-3 mr-0.5 fill-amber-400" />
                          Alta
                        </span>
                      )}

                      {topic.estimatedHours && topic.estimatedHours > 0 && (
                        <span className="text-[10px] text-neutral-500 font-mono">
                          • {topic.estimatedHours}h
                        </span>
                      )}
                    </div>

                    {topic.description && (
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {topic.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Mastery Level Selector & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-850">
                  {/* Mastery Pill Selector 0 to 4 */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-neutral-400 mr-1 hidden sm:inline">
                      Domínio:
                    </span>
                    {MASTERY_LEVELS.map((lvl) => {
                      const isSelected = topic.masteryLevel === lvl.level;

                      return (
                        <button
                          key={lvl.level}
                          onClick={() => handleMasteryChange(topic.id, lvl.level)}
                          className={`h-6 w-6 rounded text-xs font-mono font-bold transition-all ${
                            isSelected
                              ? `${lvl.color} ring-1 ring-white/20 scale-105`
                              : "bg-neutral-950 text-neutral-600 hover:text-neutral-300 border border-neutral-850"
                          }`}
                          title={`${lvl.level} — ${lvl.label}`}
                        >
                          {lvl.level}
                        </button>
                      );
                    })}
                  </div>

                  {/* Reorder and Edit Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMove(index, "UP")}
                      disabled={index === 0}
                      className="p-1 text-neutral-500 hover:text-neutral-200 disabled:opacity-30"
                      title="Mover para cima"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleMove(index, "DOWN")}
                      disabled={index === topics.length - 1}
                      className="p-1 text-neutral-500 hover:text-neutral-200 disabled:opacity-30"
                      title="Mover para baixo"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setEditingTopic(topic);
                        setTopicModalOpen(true);
                      }}
                      className="p-1 text-neutral-500 hover:text-neutral-200"
                      title="Editar"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(topic.id, topic.title)}
                      className="p-1 text-neutral-500 hover:text-red-400"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <TopicModal
        open={topicModalOpen}
        onOpenChange={setTopicModalOpen}
        subjectId={subjectId}
        assessments={assessments}
        topicToEdit={editingTopic}
        onSuccess={() => router.refresh()}
      />

      <BatchTopicModal
        open={batchModalOpen}
        onOpenChange={setBatchModalOpen}
        subjectId={subjectId}
        subjectName={subjectName}
        subjectCode={subjectCode}
        assessments={assessments}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
