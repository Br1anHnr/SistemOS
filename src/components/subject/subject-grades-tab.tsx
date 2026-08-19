"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  formatGradingFormula,
  calculateCurrentAverage,
  calculateProjectedAverage,
  calculateRequiredGrade,
  requiresFinalExam,
  GradeComponentInput,
} from "@/domain/grades";
import { updateGradingSchemeAction } from "@/actions/grading.actions";
import { deleteAssessmentAction } from "@/actions/assessment.actions";
import { AssessmentModal } from "@/components/assessment/assessment-modal";
import { GradeInputModal } from "@/components/assessment/grade-input-modal";
import { useToast } from "@/components/ui/toast";
import {
  Calculator,
  Plus,
  Trash2,
  Check,
  Loader2,
  Info,
  Award,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Settings2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";

export interface GradeComponentItem {
  id: string;
  name: string;
  code: string;
  weight: number;
  maxGrade: number;
  orderIndex: number;
  isExam: boolean;
}

export interface AssessmentItem {
  id: string;
  subjectId: string;
  gradeComponentId?: string | null;
  title: string;
  type: "EXAM" | "FINAL_EXAM" | "ASSIGNMENT" | "OTHER";
  date?: string | null;
  maxGrade: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELED";
  notes?: string | null;
  result?: { grade: number; notes?: string | null } | null;
  gradeComponent?: GradeComponentItem | null;
}

export interface GradingSchemeItem {
  id: string;
  subjectId: string;
  passingGrade: number;
  examEnabled: boolean;
  examTriggerThreshold: number;
  decimalPlaces: number;
  roundingMode: "ROUND_HALF_UP" | "ROUND_DOWN" | "ROUND_UP" | "NONE";
  components: GradeComponentItem[];
}

export function SubjectGradesTab({
  subjectId,
  gradingScheme,
  assessments = [],
}: {
  subjectId: string;
  gradingScheme: GradingSchemeItem | null;
  assessments?: AssessmentItem[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [assessmentModalOpen, setAssessmentModalOpen] = React.useState(false);
  const [editingAssessment, setEditingAssessment] = React.useState<AssessmentItem | null>(null);
  const [gradeModalOpen, setGradeModalOpen] = React.useState(false);
  const [selectedAssessmentForGrade, setSelectedAssessmentForGrade] = React.useState<AssessmentItem | null>(null);

  const [showSettings, setShowSettings] = React.useState(false);
  const [settingsLoading, setSettingsLoading] = React.useState(false);
  const [settingsError, setSettingsError] = React.useState<string | null>(null);

  // Scheme settings state
  const [passingGrade, setPassingGrade] = React.useState(
    gradingScheme ? gradingScheme.passingGrade : 5
  );
  const [examEnabled, setExamEnabled] = React.useState(
    gradingScheme ? gradingScheme.examEnabled : true
  );
  const [examTriggerThreshold, setExamTriggerThreshold] = React.useState(
    gradingScheme ? gradingScheme.examTriggerThreshold : 5
  );
  const [components, setComponents] = React.useState<GradeComponentItem[]>(
    gradingScheme?.components && gradingScheme.components.length > 0
      ? gradingScheme.components
      : []
  );

  // Interactive Simulator State
  const [simulatedGrade, setSimulatedGrade] = React.useState<string>("");
  const [targetAverageInput, setTargetAverageInput] = React.useState<string>(
    gradingScheme ? gradingScheme.passingGrade.toString() : "5.0"
  );

  React.useEffect(() => {
    if (gradingScheme) {
      setPassingGrade(gradingScheme.passingGrade);
      setExamEnabled(gradingScheme.examEnabled);
      setExamTriggerThreshold(gradingScheme.examTriggerThreshold);
      setComponents(gradingScheme.components);
      setTargetAverageInput(gradingScheme.passingGrade.toString());
    }
  }, [gradingScheme]);

  // Map components to their current graded values from actual assessments
  const componentInputs: GradeComponentInput[] = React.useMemo(() => {
    if (!components || components.length === 0) return [];

    return components.map((comp) => {
      // Look for assessment linked to this component with a grade
      const match = assessments.find(
        (a) =>
          (a.gradeComponentId === comp.id ||
            a.title.toLowerCase().includes(comp.code.toLowerCase())) &&
          a.result != null
      );

      return {
        grade: match?.result ? match.result.grade : null,
        weight: comp.weight,
        isExam: comp.isExam,
      };
    });
  }, [components, assessments]);

  // Real calculations using pure domain functions
  const currentAverage = React.useMemo(() => {
    return calculateCurrentAverage(componentInputs);
  }, [componentInputs]);

  const targetAverage = Number(targetAverageInput) || 5;
  const requiredGrade = React.useMemo(() => {
    return calculateRequiredGrade(componentInputs, targetAverage);
  }, [componentInputs, targetAverage]);

  const simulatedProjectedAverage = React.useMemo(() => {
    const sim = Number(simulatedGrade);
    if (isNaN(sim) || simulatedGrade === "") return null;
    return calculateProjectedAverage(componentInputs, sim);
  }, [componentInputs, simulatedGrade]);

  const isExamNeeded = React.useMemo(() => {
    return requiresFinalExam(componentInputs, examTriggerThreshold);
  }, [componentInputs, examTriggerThreshold]);

  const nonExamComponents = componentInputs.filter((c) => !c.isExam);
  const gradedComponentsCount = nonExamComponents.filter((c) => c.grade != null).length;
  const pendingComponentsCount = nonExamComponents.length - gradedComponentsCount;
  const allGraded = nonExamComponents.length > 0 && pendingComponentsCount === 0;

  // Academic situation
  let academicStatus: {
    label: string;
    description: string;
    variant: "success" | "warning" | "destructive" | "secondary" | "info";
  } = {
    label: "Sem notas lançadas",
    description: "Lance as notas das avaliações para acompanhar sua média.",
    variant: "secondary",
  };

  if (currentAverage !== null) {
    if (allGraded) {
      if (currentAverage >= passingGrade) {
        academicStatus = {
          label: "Aprovado Direto",
          description: `Parabéns! Média final de ${currentAverage.toFixed(2)} atingiu o critério de aprovação.`,
          variant: "success",
        };
      } else if (isExamNeeded) {
        academicStatus = {
          label: "Exame Obrigatório",
          description: `Média final de ${currentAverage.toFixed(2)} abaixo do limite (${examTriggerThreshold}). Realização de exame final necessária.`,
          variant: "warning",
        };
      } else {
        academicStatus = {
          label: "Reprovado",
          description: `Média final de ${currentAverage.toFixed(2)} insuficiente.`,
          variant: "destructive",
        };
      }
    } else {
      if (currentAverage >= passingGrade) {
        academicStatus = {
          label: "Em Andamento (Favorável)",
          description: `Média parcial de ${currentAverage.toFixed(2)} acima da nota de corte (${passingGrade}).`,
          variant: "info" as any,
        };
      } else {
        academicStatus = {
          label: "Em Andamento (Atenção)",
          description: `Média parcial de ${currentAverage.toFixed(2)} abaixo da nota de corte (${passingGrade}).`,
          variant: "warning",
        };
      }
    }
  }

  // Formula preview
  const formulaPreview = React.useMemo(() => {
    const regular = components.filter((c) => !c.isExam);
    return formatGradingFormula(
      regular.map((c) => ({ name: c.code, weight: c.weight }))
    );
  }, [components]);

  const handleDeleteAssessment = async (id: string, title: string) => {
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingScheme) return;

    if (components.some((c) => c.weight <= 0)) {
      setSettingsError("Todos os pesos devem ser maiores que zero.");
      return;
    }

    setSettingsLoading(true);
    setSettingsError(null);

    try {
      const res = await updateGradingSchemeAction(subjectId, {
        schemeId: gradingScheme.id,
        passingGrade: Number(passingGrade),
        examEnabled: Boolean(examEnabled),
        examTriggerThreshold: Number(examTriggerThreshold),
        decimalPlaces: 2,
        components: components.map((c, idx) => ({
          name: c.name,
          code: c.code,
          weight: Number(c.weight),
          maxGrade: Number(c.maxGrade),
          orderIndex: idx + 1,
          isExam: Boolean(c.isExam),
        })),
      });

      if (!res.success) {
        setSettingsError(res.error || "Erro ao salvar sistema de notas.");
        return;
      }

      toast("Sistema de avaliação atualizado!");
      setShowSettings(false);
      router.refresh();
    } catch {
      setSettingsError("Erro inesperado ao salvar.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleComponentChange = (
    index: number,
    field: keyof GradeComponentItem,
    value: any
  ) => {
    setComponents((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddComponent = () => {
    const nextIndex = components.length + 1;
    setComponents((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        name: `Avaliação ${nextIndex}`,
        code: `P${nextIndex}`,
        weight: 1,
        maxGrade: 10,
        orderIndex: nextIndex,
        isExam: false,
      },
    ]);
  };

  const handleRemoveComponent = (index: number) => {
    if (components.length <= 1) {
      toast("A disciplina precisa de pelo menos um componente.", "error");
      return;
    }
    setComponents((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Average Card */}
        <Card className="border-neutral-800 bg-neutral-900/40 p-5">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Média Atual</span>
            <Calculator className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-neutral-100">
              {currentAverage !== null ? currentAverage.toFixed(2) : "—"}
            </span>
            <span className="text-xs text-neutral-400">
              / {passingGrade} (mínima)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-400">
            {gradedComponentsCount} de {nonExamComponents.length} componente(s) avaliado(s)
          </div>
        </Card>

        {/* Status / Situation Card */}
        <Card className="border-neutral-800 bg-neutral-900/40 p-5">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Situação Acadêmica</span>
            {academicStatus.variant === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : academicStatus.variant === "warning" ? (
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            ) : (
              <Award className="h-4 w-4 text-purple-400" />
            )}
          </div>
          <div>
            <Badge variant={academicStatus.variant} className="text-xs">
              {academicStatus.label}
            </Badge>
          </div>
          <p className="mt-2 text-[11px] text-neutral-400 leading-tight">
            {academicStatus.description}
          </p>
        </Card>

        {/* Required Grade Card */}
        <Card className="border-neutral-800 bg-neutral-900/40 p-5">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Nota Necessária</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-neutral-100">
              {pendingComponentsCount === 0
                ? "—"
                : requiredGrade !== null
                ? requiredGrade <= 0
                  ? "0.00"
                  : requiredGrade.toFixed(2)
                : "—"}
            </span>
            {pendingComponentsCount > 0 && requiredGrade !== null && (
              <span className="text-xs text-neutral-400">
                {requiredGrade > 10
                  ? "(Meta inalcançável)"
                  : requiredGrade <= 0
                  ? "(Já aprovado)"
                  : "em cada prova pendente"}
              </span>
            )}
          </div>
          <div className="mt-2 text-[11px] text-neutral-400">
            para atingir média {targetAverage}
          </div>
        </Card>
      </div>

      {/* Simulator Card */}
      <Card className="border-neutral-800 bg-neutral-900/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400" />
            Simulador de Notas e Metas
          </CardTitle>
          <CardDescription>
            Simule cenários futuros sem alterar seus dados reais gravados.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Scenario 1: Target Grade */}
            <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-850 space-y-2">
              <label className="block text-xs font-medium text-neutral-300">
                Quanto preciso tirar para ter média...
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={targetAverageInput}
                  onChange={(e) => setTargetAverageInput(e.target.value)}
                  className="h-8 text-sm w-24 font-mono text-center"
                />
                <div className="text-xs text-neutral-300">
                  {pendingComponentsCount === 0 ? (
                    <span className="text-neutral-500">Todas provas já foram feitas.</span>
                  ) : requiredGrade !== null ? (
                    requiredGrade <= 0 ? (
                      <span className="text-emerald-400 font-medium">Você já atingiu esta meta!</span>
                    ) : requiredGrade > 10 ? (
                      <span className="text-red-400 font-medium">Inalcançável (precisaria de {requiredGrade.toFixed(2)})</span>
                    ) : (
                      <span>
                        Precisa tirar <strong className="text-neutral-100 font-mono text-sm">{requiredGrade.toFixed(2)}</strong> nas provas pendentes.
                      </span>
                    )
                  ) : (
                    <span className="text-neutral-500">—</span>
                  )}
                </div>
              </div>
            </div>

            {/* Scenario 2: What-if Projected Grade */}
            <div className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-850 space-y-2">
              <label className="block text-xs font-medium text-neutral-300">
                E se eu tirar nota... na(s) próxima(s) prova(s)?
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={simulatedGrade}
                  onChange={(e) => setSimulatedGrade(e.target.value)}
                  placeholder="Ex: 7.5"
                  className="h-8 text-sm w-24 font-mono text-center"
                />
                <div className="text-xs text-neutral-300">
                  {simulatedProjectedAverage !== null ? (
                    <span>
                      Sua média projetada será{" "}
                      <strong className="text-neutral-100 font-mono text-sm">
                        {simulatedProjectedAverage.toFixed(2)}
                      </strong>
                    </span>
                  ) : (
                    <span className="text-neutral-500">Digite uma nota para simular.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessments List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-100">Avaliações e Notas Reais</h3>
            <p className="text-xs text-neutral-400">
              Provas, trabalhos e registros de notas da disciplina.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingAssessment(null);
              setAssessmentModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nova Avaliação
          </Button>
        </div>

        {assessments.length === 0 ? (
          <div className="p-8 rounded-lg border border-dashed border-neutral-800 text-center space-y-3">
            <Award className="h-8 w-8 text-neutral-500 mx-auto" />
            <h4 className="text-sm font-semibold text-neutral-200">Nenhuma avaliação cadastrada</h4>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Cadastre suas provas (P1, P2) para lançar notas e acompanhar seu desempenho acadêmico.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingAssessment(null);
                setAssessmentModalOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Cadastrar P1 / Prova
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {assessments.map((a) => {
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
                        <span className="font-semibold text-sm text-neutral-100">
                          {a.title}
                        </span>
                        {a.gradeComponent && (
                          <Badge variant="outline" className="text-[10px] font-mono">
                            Peso: {a.gradeComponent.weight}
                          </Badge>
                        )}
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
                          setSelectedAssessmentForGrade(a);
                          setGradeModalOpen(true);
                        }}
                        className="h-8 text-xs border-neutral-750"
                      >
                        {hasGrade ? "Editar Nota" : "Lançar Nota"}
                      </Button>

                      <button
                        onClick={() => handleDeleteAssessment(a.id, a.title)}
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
      </div>

      {/* Expandable Evaluation System Configuration */}
      <div className="pt-4 border-t border-neutral-850">
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center justify-between w-full p-3 rounded-lg bg-neutral-900/40 border border-neutral-850 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-neutral-400" />
            <span>Configuração de Pesos e Critérios de Média</span>
            <span className="font-mono text-neutral-500">
              ({formulaPreview})
            </span>
          </div>
          {showSettings ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showSettings && (
          <form onSubmit={handleSaveSettings} className="mt-4 space-y-4 p-4 rounded-lg bg-neutral-950/80 border border-neutral-850">
            {settingsError && (
              <div className="rounded-md bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-300">
                {settingsError}
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded bg-neutral-900 border border-neutral-800 text-xs">
              <span className="text-neutral-400">Fórmula Resultante:</span>
              <span className="font-mono font-bold text-neutral-100">
                Média = {formulaPreview}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-200">
                  Pesos dos Componentes
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddComponent}
                  className="h-7 text-xs border-neutral-750"
                >
                  <Plus className="h-3 w-3 mr-1" /> Adicionar Componente
                </Button>
              </div>

              {components.map((comp, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={comp.code}
                    onChange={(e) => handleComponentChange(idx, "code", e.target.value)}
                    placeholder="P1"
                    className="w-16 font-mono text-center text-xs h-8 uppercase"
                    required
                  />
                  <Input
                    value={comp.name}
                    onChange={(e) => handleComponentChange(idx, "name", e.target.value)}
                    placeholder="Nome da prova"
                    className="flex-1 text-xs h-8"
                    required
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-neutral-400">Peso:</span>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={comp.weight}
                      onChange={(e) => handleComponentChange(idx, "weight", Number(e.target.value))}
                      className="w-16 text-center font-mono text-xs h-8"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveComponent(idx)}
                    className="p-1 text-neutral-500 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Média de Aprovação
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={passingGrade}
                  onChange={(e) => setPassingGrade(Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Limite para Exame
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={examTriggerThreshold}
                  onChange={(e) => setExamTriggerThreshold(Number(e.target.value))}
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" disabled={settingsLoading}>
                {settingsLoading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Salvar Pesos e Regras
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Modals */}
      <AssessmentModal
        open={assessmentModalOpen}
        onOpenChange={setAssessmentModalOpen}
        subjectId={subjectId}
        gradeComponents={components}
        assessmentToEdit={editingAssessment}
        onSuccess={() => router.refresh()}
      />

      <GradeInputModal
        open={gradeModalOpen}
        onOpenChange={setGradeModalOpen}
        assessment={selectedAssessmentForGrade}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
