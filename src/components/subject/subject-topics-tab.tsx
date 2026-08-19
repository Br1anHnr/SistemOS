"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  calculateTopicProgress,
  calculateMasteryAverage,
  calculateMasteryDistribution,
  calculateEstimatedRemainingStudyHours,
  buildTopicTree,
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
import { PdfViewerModal } from "@/components/material/pdf-viewer-modal";
import { StudyWorkspaceModal } from "@/components/study-workspace/study-workspace-modal";
import { useToast } from "@/components/ui/toast";
import {
  FileText,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Award,
  Layers,
  Eye,
  GripVertical,
  BookOpen,
  Bookmark,
  PenLine,
} from "lucide-react";
import { useRouter } from "next/navigation";

export interface TopicWithAssessment extends TopicItem {
  id: string;
  subjectId: string;
  parentId?: string | null;
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
  notesCount?: number;
  bookmarksCount?: number;
  annotationsCount?: number;
}

export interface SubjectMaterialItem {
  id: string;
  subjectId: string;
  topicId?: string | null;
  title: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize?: number | null;
  pageCount?: number | null;
  createdAt: Date | string;
}

export function SubjectTopicsTab({
  subjectId,
  subjectName,
  subjectCode,
  topics = [],
  materials = [],
  assessments = [],
}: {
  subjectId: string;
  subjectName?: string | null;
  subjectCode?: string | null;
  topics?: TopicWithAssessment[];
  materials?: SubjectMaterialItem[];
  assessments?: Array<{ id: string; title: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();

  // Modals state
  const [topicModalOpen, setTopicModalOpen] = React.useState(false);
  const [batchModalOpen, setBatchModalOpen] = React.useState(false);
  const [editingTopic, setEditingTopic] = React.useState<TopicWithAssessment | null>(null);
  const [targetParentId, setTargetParentId] = React.useState<string | null>(null);

  // PDF Viewer state (Lightweight standalone reader)
  const [pdfViewerOpen, setPdfViewerOpen] = React.useState(false);
  const [activeMaterialId, setActiveMaterialId] = React.useState<string | null>(null);
  const [activeTopicId, setActiveTopicId] = React.useState<string | null>(null);
  const [activePdfUrl, setActivePdfUrl] = React.useState<string | null>(null);
  const [activePdfTitle, setActivePdfTitle] = React.useState<string>("");
  const [activePdfFileName, setActivePdfFileName] = React.useState<string>("");

  // Study Workspace state (Integrated PDF + Study Panel)
  const [workspaceOpen, setWorkspaceOpen] = React.useState(false);
  const [workspaceTopic, setWorkspaceTopic] = React.useState<TopicWithAssessment | null>(null);
  const [workspaceMaterial, setWorkspaceMaterial] = React.useState<SubjectMaterialItem | null>(null);

  // Accordion expanded state for parent modules
  const [expandedParents, setExpandedParents] = React.useState<Record<string, boolean>>({});

  // Drag and Drop state
  const [draggedParentId, setDraggedParentId] = React.useState<string | null>(null);
  const [dragOverParentId, setDragOverParentId] = React.useState<string | null>(null);
  const [draggedSubId, setDraggedSubId] = React.useState<{ parentId: string; id: string } | null>(null);
  const [dragOverSubId, setDragOverSubId] = React.useState<string | null>(null);

  // Domain calculations
  const progress = React.useMemo(() => calculateTopicProgress(topics), [topics]);
  const mastery = React.useMemo(() => calculateMasteryAverage(topics), [topics]);
  const distribution = React.useMemo(() => calculateMasteryDistribution(topics), [topics]);
  const remainingHours = React.useMemo(() => calculateEstimatedRemainingStudyHours(topics), [topics]);

  // Hierarchical Tree
  const initialTree = React.useMemo(() => buildTopicTree(topics), [topics]);
  const [topicTree, setTopicTree] = React.useState(initialTree);

  // Synchronize tree when topics change
  React.useEffect(() => {
    setTopicTree(buildTopicTree(topics));
  }, [topics]);

  // Map materials to topicId
  const materialsByTopicId = React.useMemo(() => {
    const map = new Map<string, SubjectMaterialItem>();
    for (const m of materials) {
      if (m.topicId) map.set(m.topicId, m);
    }
    return map;
  }, [materials]);

  // Parent topics list for modal dropdown
  const parentOptions = React.useMemo(() => {
    return topics
      .filter((t) => !t.parentId)
      .map((t) => ({ id: t.id, title: t.title }));
  }, [topics]);

  // Expand all parent modules by default
  React.useEffect(() => {
    const initial: Record<string, boolean> = {};
    for (const p of topicTree) {
      initial[p.id] = true;
    }
    setExpandedParents(initial);
  }, [topicTree.length]);

  const toggleExpand = (parentId: string) => {
    setExpandedParents((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  };

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
      const res = await toggleTopicCompleteAction(topic.id, subjectId, !isCompleted);
      if (res.success) {
        toast(!isCompleted ? "Marcado como dominado!" : "Reaberto para estudo.");
        router.refresh();
      } else {
        toast(res.error || "Erro ao alterar conclusão.", "error");
      }
    } catch {
      toast("Erro ao alterar status.", "error");
    }
  };

  // --- DRAG AND DROP HANDLERS FOR PARENT LESSONS ---
  const handleDropParent = async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    const currentList = [...topicTree];
    const sourceIndex = currentList.findIndex((p) => p.id === sourceId);
    const targetIndex = currentList.findIndex((p) => p.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const [moved] = currentList.splice(sourceIndex, 1);
    currentList.splice(targetIndex, 0, moved);

    setTopicTree(currentList);
    setDraggedParentId(null);
    setDragOverParentId(null);

    const reorderedPayload = currentList.map((item, idx) => ({
      id: item.id,
      orderIndex: idx + 1,
    }));

    try {
      const res = await reorderTopicsAction(subjectId, reorderedPayload);
      if (res.success) {
        router.refresh();
      }
    } catch {
      // Keep optimistic
    }
  };

  // --- DRAG AND DROP HANDLERS FOR SUBTOPICS ---
  const handleDropSubtopic = async (
    parentId: string,
    sourceSubId: string,
    targetSubId: string
  ) => {
    if (sourceSubId === targetSubId) return;

    const currentList = [...topicTree];
    const parentIndex = currentList.findIndex((p) => p.id === parentId);
    if (parentIndex === -1) return;

    const subtopics = [...currentList[parentIndex].subtopics];
    const sourceIndex = subtopics.findIndex((s) => s.id === sourceSubId);
    const targetIndex = subtopics.findIndex((s) => s.id === targetSubId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const [moved] = subtopics.splice(sourceIndex, 1);
    subtopics.splice(targetIndex, 0, moved);

    currentList[parentIndex] = {
      ...currentList[parentIndex],
      subtopics,
    };

    setTopicTree(currentList);
    setDraggedSubId(null);
    setDragOverSubId(null);

    const reorderedPayload = subtopics.map((item, idx) => ({
      id: item.id,
      orderIndex: idx + 1,
    }));

    try {
      const res = await reorderTopicsAction(subjectId, reorderedPayload);
      if (res.success) {
        router.refresh();
      }
    } catch {
      // Keep optimistic
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Deseja excluir "${title}" e seus subitens?`)) return;
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

  const handleOpenPdf = (material: SubjectMaterialItem) => {
    setActiveMaterialId(material.id);
    setActiveTopicId(material.topicId || null);
    setActivePdfUrl(material.fileUrl);
    setActivePdfTitle(material.title);
    setActivePdfFileName(material.fileName);
    setPdfViewerOpen(true);
  };

  const handleOpenStudyWorkspace = (topic: TopicWithAssessment) => {
    const linked =
      materialsByTopicId.get(topic.id) ||
      materials.find(
        (m) => m.title === topic.title || m.fileName.includes(topic.title)
      ) ||
      null;

    setWorkspaceTopic(topic);
    setWorkspaceMaterial(linked);
    setWorkspaceOpen(true);
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
              ({progress.completedCount}/{progress.total} dominados)
            </span>
          </div>
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
          <div className="flex gap-1 mt-3">
            {MASTERY_LEVELS.map((lvl) => {
              const count = distribution[lvl.level] || 0;
              return (
                <div
                  key={lvl.level}
                  className={`flex-1 text-center py-0.5 rounded text-[10px] font-mono border ${lvl.color}`}
                  title={`${lvl.label}: ${count} item(s)`}
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

      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-400" />
            Aulas & Conteúdos da Disciplina ({topics.length})
          </h3>
          <p className="text-xs text-neutral-400">
            Arraste os cards para priorizar a ordem de estudos e entre no modo Estudar para tomar notas por página.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Main Add Lecture / Material Button */}
          <Button
            size="sm"
            onClick={() => setBatchModalOpen(true)}
            className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Adicionar Aula / PDF
          </Button>

          {/* New Topic Manual Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingTopic(null);
              setTargetParentId(null);
              setTopicModalOpen(true);
            }}
            className="text-xs border-neutral-750"
          >
            Novo Tópico Manual
          </Button>
        </div>
      </div>

      {/* Topic Tree List */}
      {topics.length === 0 ? (
        <div className="p-8 rounded-lg border border-dashed border-neutral-800 text-center space-y-3">
          <FileText className="h-8 w-8 text-neutral-500 mx-auto" />
          <h4 className="text-sm font-semibold text-neutral-200">
            Nenhuma aula ou conteúdo cadastrado
          </h4>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Clique em <strong>Adicionar Aula / PDF</strong> para enviar os slides da matéria (ex: <em>Aula 01</em>, <em>Aula 02</em>) e estudar com anotações vinculadas às páginas.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => setBatchModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Adicionar Aula / PDF
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingTopic(null);
                setTargetParentId(null);
                setTopicModalOpen(true);
              }}
            >
              Criar Tópico Manual
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {topicTree.map((parent, pIndex) => {
            const hasSubtopics = parent.subtopics && parent.subtopics.length > 0;
            const isExpanded = expandedParents[parent.id] ?? true;
            const isParentCompleted =
              parent.status === "COMPLETED" || parent.masteryLevel === 4;

            const linkedMaterial =
              materialsByTopicId.get(parent.id) ||
              materials.find(
                (m) => m.title === parent.title || m.fileName.includes(parent.title)
              );

            const isDraggingThis = draggedParentId === parent.id;
            const isDragOverThis = dragOverParentId === parent.id;

            return (
              <div
                key={parent.id}
                draggable
                onDragStart={(e) => {
                  setDraggedParentId(parent.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverParentId !== parent.id) {
                    setDragOverParentId(parent.id);
                  }
                }}
                onDragLeave={() => {
                  if (dragOverParentId === parent.id) {
                    setDragOverParentId(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedParentId) {
                    handleDropParent(draggedParentId, parent.id);
                  }
                }}
                onDragEnd={() => {
                  setDraggedParentId(null);
                  setDragOverParentId(null);
                }}
                className={`rounded-xl border transition-all duration-200 overflow-hidden shadow-sm ${
                  isDraggingThis
                    ? "opacity-40 scale-[0.99] border-dashed border-purple-500 bg-purple-950/20"
                    : isDragOverThis
                    ? "border-purple-500 ring-2 ring-purple-500/30 scale-[1.01] bg-neutral-900/90"
                    : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-750"
                }`}
              >
                {/* Parent Header */}
                <div
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 p-3.5 transition-colors ${
                    hasSubtopics
                      ? "bg-neutral-900/60 hover:bg-neutral-900/90"
                      : isParentCompleted
                      ? "bg-emerald-950/10"
                      : "bg-neutral-900/30"
                  }`}
                >
                  {/* Left: Drag Handle + Chevron + Checkbox + Title */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 text-neutral-500 hover:text-neutral-200 transition-colors shrink-0"
                      title="Arrastar para reordenar prioridade"
                    >
                      <GripVertical className="h-4 w-4" />
                    </div>

                    {hasSubtopics ? (
                      <button
                        type="button"
                        onClick={() => toggleExpand(parent.id)}
                        className="p-1 text-neutral-400 hover:text-white shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleComplete(parent)}
                        className="p-1 text-neutral-500 hover:text-emerald-400 shrink-0"
                      >
                        {isParentCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Circle className="h-4 w-4 text-neutral-600" />
                        )}
                      </button>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-semibold cursor-pointer ${
                            isParentCompleted ? "text-neutral-300" : "text-neutral-100"
                          }`}
                          onClick={() => hasSubtopics && toggleExpand(parent.id)}
                        >
                          {parent.title}
                        </span>

                        {/* ESTUDAR / WORKSPACE BUTTON */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStudyWorkspace(parent);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white transition-colors shadow-sm"
                          title="Abrir Workspace de Estudo com PDF e notas"
                        >
                          <BookOpen className="h-3 w-3" />
                          Estudar
                        </button>

                        {/* VER PDF STANDALONE BUTTON */}
                        {linkedMaterial && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPdf(linkedMaterial);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-900 border border-neutral-750 text-neutral-300 hover:text-white transition-colors"
                            title="Visualizar PDF direto"
                          >
                            <Eye className="h-3 w-3" />
                            Ver PDF
                          </button>
                        )}

                        {/* NOTES COUNT BADGE */}
                        {parent.notesCount !== undefined && parent.notesCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-950/40 text-blue-300 border border-blue-800/60">
                            <FileText className="h-2.5 w-2.5" />
                            {parent.notesCount} nota(s)
                          </span>
                        )}

                        {/* BOOKMARKS COUNT BADGE */}
                        {parent.bookmarksCount !== undefined && parent.bookmarksCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950/40 text-emerald-300 border border-emerald-800/60">
                            <Bookmark className="h-2.5 w-2.5" />
                            {parent.bookmarksCount} marcador(es)
                          </span>
                        )}

                        {/* ANNOTATIONS COUNT BADGE */}
                        {parent.annotationsCount !== undefined && parent.annotationsCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-950/40 text-purple-300 border border-purple-800/60">
                            <PenLine className="h-2.5 w-2.5" />
                            {parent.annotationsCount} anotação(ões)
                          </span>
                        )}

                        {hasSubtopics && (
                          <Badge
                            variant="secondary"
                            className="bg-neutral-900 text-neutral-300 border-neutral-800 text-[10px] font-mono px-1.5 py-0"
                          >
                            {parent.subtopics.length} subconteúdo(s)
                          </Badge>
                        )}

                        {parent.assessmentTitle && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono text-blue-400 border-blue-800"
                          >
                            <Award className="h-3 w-3 mr-1" />
                            {parent.assessmentTitle}
                          </Badge>
                        )}
                      </div>

                      {parent.description && (
                        <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-md">
                          {parent.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions and Mastery */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingTopic(null);
                        setTargetParentId(parent.id);
                        setTopicModalOpen(true);
                      }}
                      className="h-7 text-xs px-2 text-purple-300 hover:text-purple-200 hover:bg-purple-950/30"
                      title="Adicionar subconteúdo a esta aula"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Subtópico
                    </Button>

                    {!hasSubtopics && (
                      <div className="flex items-center gap-1">
                        {MASTERY_LEVELS.map((lvl) => {
                          const isSelected = parent.masteryLevel === lvl.level;
                          return (
                            <button
                              key={lvl.level}
                              onClick={() => handleMasteryChange(parent.id, lvl.level)}
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
                    )}

                    <div className="flex items-center gap-1 text-neutral-500">
                      <button
                        onClick={() => {
                          setEditingTopic(parent);
                          setTopicModalOpen(true);
                        }}
                        className="p-1 hover:text-neutral-200"
                        title="Editar"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(parent.id, parent.title)}
                        className="p-1 hover:text-red-400"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subtopics Children List */}
                {hasSubtopics && isExpanded && (
                  <div className="divide-y divide-neutral-900 bg-neutral-950/90 pl-6 sm:pl-8 pr-3 py-1 border-t border-neutral-850/60">
                    {parent.subtopics.map((sub) => {
                      const isSubCompleted =
                        sub.status === "COMPLETED" || sub.masteryLevel === 4;

                      const isDraggingSub =
                        draggedSubId?.parentId === parent.id && draggedSubId.id === sub.id;
                      const isDragOverSub = dragOverSubId === sub.id;

                      return (
                        <div
                          key={sub.id}
                          draggable
                          onDragStart={(e) => {
                            e.stopPropagation();
                            setDraggedSubId({ parentId: parent.id, id: sub.id });
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.dataTransfer.dropEffect = "move";
                            if (dragOverSubId !== sub.id) {
                              setDragOverSubId(sub.id);
                            }
                          }}
                          onDragLeave={(e) => {
                            e.stopPropagation();
                            if (dragOverSubId === sub.id) {
                              setDragOverSubId(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (draggedSubId && draggedSubId.parentId === parent.id) {
                              handleDropSubtopic(parent.id, draggedSubId.id, sub.id);
                            }
                          }}
                          onDragEnd={(e) => {
                            e.stopPropagation();
                            setDraggedSubId(null);
                            setDragOverSubId(null);
                          }}
                          className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2 pr-1 transition-all rounded ${
                            isDraggingSub
                              ? "opacity-30 border border-dashed border-purple-500 bg-purple-950/20"
                              : isDragOverSub
                              ? "border-t-2 border-purple-500 bg-purple-950/20"
                              : "hover:bg-neutral-900/40"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="cursor-grab active:cursor-grabbing p-0.5 text-neutral-600 hover:text-neutral-300 shrink-0"
                              title="Arrastar subtópico"
                            >
                              <GripVertical className="h-3.5 w-3.5" />
                            </div>

                            <button
                              onClick={() => handleToggleComplete(sub as any)}
                              className="p-0.5 text-neutral-500 hover:text-emerald-400 shrink-0"
                            >
                              {isSubCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              ) : (
                                <Circle className="h-4 w-4 text-neutral-600" />
                              )}
                            </button>

                            <div className="min-w-0 flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-xs font-medium ${
                                  isSubCompleted
                                    ? "text-neutral-400 line-through decoration-neutral-600"
                                    : "text-neutral-200"
                                }`}
                              >
                                {sub.title}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleOpenStudyWorkspace(sub as any)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-950/40 text-purple-300 border border-purple-800/60 hover:bg-purple-900/60"
                                title="Estudar este subtópico"
                              >
                                <BookOpen className="h-2.5 w-2.5" />
                                Estudar
                              </button>

                              {sub.assessmentTitle && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] font-mono text-blue-400 border-blue-800"
                                >
                                  {sub.assessmentTitle}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-6 sm:pl-0">
                            <div className="flex items-center gap-1">
                              {MASTERY_LEVELS.map((lvl) => {
                                const isSelected = sub.masteryLevel === lvl.level;
                                return (
                                  <button
                                    key={lvl.level}
                                    onClick={() => handleMasteryChange(sub.id, lvl.level)}
                                    className={`h-5 w-5 rounded text-[10px] font-mono font-bold transition-all ${
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

                            <div className="flex items-center gap-1 text-neutral-500">
                              <button
                                onClick={() => {
                                  setEditingTopic(sub as any);
                                  setTopicModalOpen(true);
                                }}
                                className="p-1 hover:text-neutral-200"
                                title="Editar Subtópico"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(sub.id, sub.title)}
                                className="p-1 hover:text-red-400"
                                title="Excluir Subtópico"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
        parentTopics={parentOptions}
        defaultParentId={targetParentId}
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

      {/* Lightweight Standalone PDF Viewer */}
      <PdfViewerModal
        open={pdfViewerOpen}
        onOpenChange={setPdfViewerOpen}
        title={activePdfTitle}
        materialId={activeMaterialId}
        topicId={activeTopicId}
        pdfUrl={activePdfUrl}
        fileName={activePdfFileName}
      />

      {/* Integrated Study Workspace with Notes & Bookmarks */}
      {workspaceTopic && (
        <StudyWorkspaceModal
          open={workspaceOpen}
          onOpenChange={setWorkspaceOpen}
          topicId={workspaceTopic.id}
          topicTitle={workspaceTopic.title}
          subjectId={subjectId}
          materialId={workspaceMaterial?.id}
          pdfUrl={workspaceMaterial?.fileUrl}
          fileName={workspaceMaterial?.fileName}
        />
      )}
    </div>
  );
}
