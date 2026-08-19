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
import {
  createMaterialAction,
  deleteMaterialAction,
} from "@/actions/material.actions";
import { TopicModal } from "@/components/topic/topic-modal";
import { BatchTopicModal } from "@/components/topic/batch-topic-modal";
import { PdfViewerModal } from "@/components/material/pdf-viewer-modal";
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
  ChevronRight,
  Sparkles,
  Flame,
  Award,
  Filter,
  Layers,
  FolderOpen,
  Eye,
  Upload,
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
  const pdfInputRef = React.useRef<HTMLInputElement | null>(null);

  // Modals state
  const [topicModalOpen, setTopicModalOpen] = React.useState(false);
  const [batchModalOpen, setBatchModalOpen] = React.useState(false);
  const [editingTopic, setEditingTopic] = React.useState<TopicWithAssessment | null>(null);
  const [targetParentId, setTargetParentId] = React.useState<string | null>(null);

  // PDF Viewer state
  const [pdfViewerOpen, setPdfViewerOpen] = React.useState(false);
  const [activePdfUrl, setActivePdfUrl] = React.useState<string | null>(null);
  const [activePdfTitle, setActivePdfTitle] = React.useState<string>("");
  const [activePdfFileName, setActivePdfFileName] = React.useState<string>("");

  // Accordion expanded state for parent modules
  const [expandedParents, setExpandedParents] = React.useState<Record<string, boolean>>({});

  // Filters
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "PENDING" | "COMPLETED">("ALL");
  const [assessmentFilter, setAssessmentFilter] = React.useState<string>("ALL");

  // Domain calculations
  const progress = React.useMemo(() => calculateTopicProgress(topics), [topics]);
  const mastery = React.useMemo(() => calculateMasteryAverage(topics), [topics]);
  const distribution = React.useMemo(() => calculateMasteryDistribution(topics), [topics]);
  const remainingHours = React.useMemo(() => calculateEstimatedRemainingStudyHours(topics), [topics]);

  // Hierarchical Tree
  const topicTree = React.useMemo(() => buildTopicTree(topics), [topics]);

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

  const handleMove = async (
    list: TopicWithAssessment[],
    index: number,
    direction: "UP" | "DOWN"
  ) => {
    if (direction === "UP" && index === 0) return;
    if (direction === "DOWN" && index === list.length - 1) return;

    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    const current = list[index];
    const target = list[targetIndex];

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

  // Upload and open PDF in in-app reader
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);

      // Save material to database
      try {
        await createMaterialAction({
          subjectId,
          title: file.name.replace(/\.[^/.]+$/, ""),
          fileName: file.name,
          fileType: "PDF",
          fileUrl: objectUrl,
          fileSize: file.size,
        });
      } catch {
        // Silently continue to open viewer
      }

      // Open in built-in reader
      setActivePdfUrl(objectUrl);
      setActivePdfTitle(file.name.replace(/\.[^/.]+$/, ""));
      setActivePdfFileName(file.name);
      setPdfViewerOpen(true);
      router.refresh();
    }
  };

  const handleOpenExistingPdf = (material: SubjectMaterialItem) => {
    setActivePdfUrl(material.fileUrl);
    setActivePdfTitle(material.title);
    setActivePdfFileName(material.fileName);
    setPdfViewerOpen(true);
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
            Ementa & Conteúdos da Disciplina ({topics.length})
          </h3>
          <p className="text-xs text-neutral-400">
            Organize módulos e subconteúdos específicos e consulte os slides e PDFs da aula no leitor integrado.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* PDF In-App Reader Button */}
          <input
            ref={pdfInputRef}
            type="file"
            accept=".pdf"
            onChange={handlePdfUpload}
            className="hidden"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (materials.length > 0) {
                handleOpenExistingPdf(materials[0]);
              } else {
                pdfInputRef.current?.click();
              }
            }}
            className="text-xs border-purple-800/60 bg-purple-950/20 text-purple-300 hover:bg-purple-950/40"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5 text-purple-400" />
            {materials.length > 0 ? `Ver Slides / PDF (${materials.length})` : "Abrir PDF da Aula"}
          </Button>

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
              setTargetParentId(null);
              setTopicModalOpen(true);
            }}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Novo Tópico
          </Button>
        </div>
      </div>

      {/* Topic Tree List */}
      {topics.length === 0 ? (
        <div className="p-8 rounded-lg border border-dashed border-neutral-800 text-center space-y-3">
          <FileText className="h-8 w-8 text-neutral-500 mx-auto" />
          <h4 className="text-sm font-semibold text-neutral-200">
            Nenhum conteúdo cadastrado
          </h4>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Arraste o arquivo PDF da disciplina para extrair os tópicos automaticamente ou crie módulos e subconteúdos manualmente.
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
                setTargetParentId(null);
                setTopicModalOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Adicionar Módulo / Tópico
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

            return (
              <div
                key={parent.id}
                className="rounded-xl border border-neutral-800 bg-neutral-950/60 overflow-hidden shadow-sm"
              >
                {/* Parent Module Header */}
                <div
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 p-3.5 transition-colors ${
                    hasSubtopics
                      ? "bg-neutral-900/60 hover:bg-neutral-900/90 cursor-pointer"
                      : isParentCompleted
                      ? "bg-emerald-950/10"
                      : "bg-neutral-900/30"
                  }`}
                  onClick={() => hasSubtopics && toggleExpand(parent.id)}
                >
                  {/* Left: Expand Chevron + Checkbox + Title */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    {hasSubtopics ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(parent.id);
                        }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleComplete(parent);
                        }}
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
                        <span className="text-sm font-semibold text-neutral-100">
                          {parent.title}
                        </span>

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
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {parent.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions and Mastery */}
                  <div
                    className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Add Subtopic Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingTopic(null);
                        setTargetParentId(parent.id);
                        setTopicModalOpen(true);
                      }}
                      className="h-7 text-xs px-2 text-purple-300 hover:text-purple-200 hover:bg-purple-950/30"
                      title="Adicionar subconteúdo a este módulo"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Subtópico
                    </Button>

                    {/* Mastery Level (only for leaf parents without subtopics) */}
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

                    {/* Reorder and Edit */}
                    <div className="flex items-center gap-1 text-neutral-500">
                      <button
                        onClick={() => handleMove(topicTree, pIndex, "UP")}
                        disabled={pIndex === 0}
                        className="p-1 hover:text-neutral-200 disabled:opacity-30"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(topicTree, pIndex, "DOWN")}
                        disabled={pIndex === topicTree.length - 1}
                        className="p-1 hover:text-neutral-200 disabled:opacity-30"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingTopic(parent);
                          setTopicModalOpen(true);
                        }}
                        className="p-1 hover:text-neutral-200"
                        title="Editar Módulo"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(parent.id, parent.title)}
                        className="p-1 hover:text-red-400"
                        title="Excluir Módulo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Subtopics Children List */}
                {hasSubtopics && isExpanded && (
                  <div className="divide-y divide-neutral-900 bg-neutral-950/90 pl-6 sm:pl-8 pr-3 py-1 border-t border-neutral-850/60">
                    {parent.subtopics.map((sub, sIndex) => {
                      const isSubCompleted =
                        sub.status === "COMPLETED" || sub.masteryLevel === 4;

                      return (
                        <div
                          key={sub.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 py-2.5 pr-1 transition-colors hover:bg-neutral-900/30 rounded"
                        >
                          {/* Subtopic Title and Checkbox */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-neutral-600 text-xs font-mono select-none">
                              ↳
                            </span>

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

                            <div className="min-w-0">
                              <span
                                className={`text-xs font-medium ${
                                  isSubCompleted
                                    ? "text-neutral-400 line-through decoration-neutral-600"
                                    : "text-neutral-200"
                                }`}
                              >
                                {sub.title}
                              </span>

                              {sub.assessmentTitle && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-[9px] font-mono text-blue-400 border-blue-800"
                                >
                                  {sub.assessmentTitle}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Subtopic Mastery & Actions */}
                          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pl-6 sm:pl-0">
                            {/* Mastery 0 to 4 */}
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

                            {/* Subtopic Actions */}
                            <div className="flex items-center gap-1 text-neutral-500">
                              <button
                                onClick={() =>
                                  handleMove(parent.subtopics as any, sIndex, "UP")
                                }
                                disabled={sIndex === 0}
                                className="p-1 hover:text-neutral-200 disabled:opacity-30"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() =>
                                  handleMove(
                                    parent.subtopics as any,
                                    sIndex,
                                    "DOWN"
                                  )
                                }
                                disabled={sIndex === parent.subtopics.length - 1}
                                className="p-1 hover:text-neutral-200 disabled:opacity-30"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
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

      <PdfViewerModal
        open={pdfViewerOpen}
        onOpenChange={setPdfViewerOpen}
        title={activePdfTitle}
        pdfUrl={activePdfUrl}
        fileName={activePdfFileName}
      />
    </div>
  );
}
