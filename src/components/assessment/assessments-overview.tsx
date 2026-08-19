"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { GradeInputModal } from "@/components/assessment/grade-input-modal";
import { AssessmentModal } from "@/components/assessment/assessment-modal";
import { deleteAssessmentAction } from "@/actions/assessment.actions";
import { useToast } from "@/components/ui/toast";
import {
  Award,
  Calendar,
  Plus,
  BookOpen,
  CheckCircle2,
  Clock,
  Trash2,
  Filter,
} from "lucide-react";
import { useRouter } from "next/navigation";

export interface AssessmentWithSubject {
  id: string;
  subjectId: string;
  gradeComponentId?: string | null;
  title: string;
  type: "EXAM" | "FINAL_EXAM" | "ASSIGNMENT" | "OTHER";
  date?: string | null;
  maxGrade: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELED";
  notes?: string | null;
  subject?: {
    id: string;
    name: string;
    code?: string | null;
    color?: string | null;
  } | null;
  result?: { grade: number; notes?: string | null } | null;
}

export function AssessmentsOverview({
  activeSemester,
  assessments,
  subjects,
}: {
  activeSemester: { id: string; name: string } | null;
  assessments: AssessmentWithSubject[];
  subjects: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [filter, setFilter] = React.useState<"ALL" | "SCHEDULED" | "COMPLETED">("ALL");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = React.useState<string>("ALL");

  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string>(
    subjects[0]?.id || ""
  );

  const [gradeModalOpen, setGradeModalOpen] = React.useState(false);
  const [selectedForGrade, setSelectedForGrade] = React.useState<AssessmentWithSubject | null>(null);

  if (!activeSemester) {
    return (
      <EmptyState
        icon={Calendar}
        title="Nenhum semestre ativo"
        description="Ative um semestre para gerenciar suas avaliações e provas."
        actionLabel="Ir para Semestres"
        onAction={() => router.push("/semester")}
      />
    );
  }

  const filteredAssessments = assessments.filter((a) => {
    if (filter === "SCHEDULED" && a.result != null) return false;
    if (filter === "COMPLETED" && a.result == null) return false;
    if (selectedSubjectFilter !== "ALL" && a.subjectId !== selectedSubjectFilter)
      return false;
    return true;
  });

  const scheduledCount = assessments.filter((a) => a.result == null).length;
  const completedCount = assessments.filter((a) => a.result != null).length;

  const handleDelete = async (id: string, subjectId: string, title: string) => {
    if (!confirm(`Deseja excluir a avaliação "${title}"?`)) return;
    try {
      const res = await deleteAssessmentAction(id, subjectId);
      if (res.success) {
        toast("Avaliação removida.");
        router.refresh();
      } else {
        toast(res.error || "Erro ao remover.", "error");
      }
    } catch {
      toast("Erro ao remover avaliação.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-neutral-800 bg-neutral-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Total de Avaliações</span>
            <Award className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-neutral-100">
            {assessments.length}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">no semestre ativo</p>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Avaliações Pendentes</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-neutral-100">
            {scheduledCount}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">aguardando realização/nota</p>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Provas Realizadas</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-neutral-100">
            {completedCount}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">com notas registradas</p>
        </Card>
      </div>

      {/* Filter and Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-neutral-850">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg bg-neutral-900 border border-neutral-800 p-0.5 text-xs">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1 rounded-md transition-all ${
                filter === "ALL"
                  ? "bg-neutral-800 text-neutral-100 font-semibold"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Todas ({assessments.length})
            </button>
            <button
              onClick={() => setFilter("SCHEDULED")}
              className={`px-3 py-1 rounded-md transition-all ${
                filter === "SCHEDULED"
                  ? "bg-neutral-800 text-neutral-100 font-semibold"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Pendentes ({scheduledCount})
            </button>
            <button
              onClick={() => setFilter("COMPLETED")}
              className={`px-3 py-1 rounded-md transition-all ${
                filter === "COMPLETED"
                  ? "bg-neutral-800 text-neutral-100 font-semibold"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Concluídas ({completedCount})
            </button>
          </div>

          {subjects.length > 0 && (
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="h-8 text-xs bg-neutral-900 border border-neutral-800 rounded-md px-2 text-neutral-200"
            >
              <option value="ALL">Todas as Disciplinas</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {subjects.length > 0 && (
          <Button
            size="sm"
            onClick={() => {
              setSelectedSubjectId(subjects[0].id);
              setCreateModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nova Avaliação
          </Button>
        )}
      </div>

      {/* Assessment List */}
      {filteredAssessments.length === 0 ? (
        <div className="p-8 rounded-lg border border-dashed border-neutral-800 text-center space-y-3">
          <Award className="h-8 w-8 text-neutral-500 mx-auto" />
          <h4 className="text-sm font-semibold text-neutral-200">
            Nenhuma avaliação encontrada
          </h4>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            {assessments.length === 0
              ? "Cadastre suas avaliações para registrar notas e simular seu desempenho."
              : "Nenhuma avaliação corresponde aos filtros selecionados."}
          </p>
          {subjects.length > 0 && assessments.length === 0 && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedSubjectId(subjects[0].id);
                setCreateModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Cadastrar Primeira Avaliação
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredAssessments.map((a) => {
            const hasGrade = a.result != null;

            return (
              <div
                key={a.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-neutral-900/40 border border-neutral-800 hover:border-neutral-750 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-950/60 border border-blue-800 text-blue-400 shrink-0 mt-0.5">
                    <Award className="h-4 w-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.subject && (
                        <Link
                          href={`/subjects/${a.subject.id}`}
                          className="flex items-center gap-1.5 hover:underline"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: a.subject.color || "#3b82f6" }}
                          />
                          <span className="text-xs font-semibold text-neutral-300">
                            {a.subject.name}
                          </span>
                        </Link>
                      )}
                      <span className="text-xs text-neutral-500">•</span>
                      <span className="font-semibold text-sm text-neutral-100">
                        {a.title}
                      </span>
                      <Badge
                        variant={hasGrade ? "success" : "secondary"}
                        className="text-[10px]"
                      >
                        {hasGrade ? "Concluída" : "Pendente"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
                      {a.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-neutral-500" />
                          {new Date(a.date).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                      {a.notes && (
                        <span className="text-neutral-500 truncate max-w-xs">
                          {a.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-850">
                  <div className="text-right">
                    {hasGrade ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold font-mono text-neutral-100">
                          {a.result!.grade.toFixed(2)}
                        </span>
                        <span className="text-xs text-neutral-400 font-mono">
                          /{a.maxGrade}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-500 italic">
                        Sem nota
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedForGrade(a);
                        setGradeModalOpen(true);
                      }}
                      className="h-8 text-xs border-neutral-750"
                    >
                      {hasGrade ? "Editar Nota" : "Lançar Nota"}
                    </Button>

                    <button
                      onClick={() => handleDelete(a.id, a.subjectId, a.title)}
                      className="p-2 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
                      title="Excluir avaliação"
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

      {selectedSubjectId && (
        <AssessmentModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          subjectId={selectedSubjectId}
          onSuccess={() => router.refresh()}
        />
      )}

      <GradeInputModal
        open={gradeModalOpen}
        onOpenChange={setGradeModalOpen}
        assessment={selectedForGrade}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
