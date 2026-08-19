"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatGradingFormula } from "@/domain/grades";
import { updateGradingSchemeAction } from "@/actions/grading.actions";
import { useToast } from "@/components/ui/toast";
import { Calculator, Plus, Trash2, Check, Loader2, Info } from "lucide-react";
import { useRouter } from "next/navigation";

export interface GradeComponentItem {
  id?: string;
  name: string;
  code: string;
  weight: number;
  maxGrade: number;
  orderIndex: number;
  isExam: boolean;
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
}: {
  subjectId: string;
  gradingScheme: GradingSchemeItem | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
      : [
          { name: "Prova 1", code: "P1", weight: 1, maxGrade: 10, orderIndex: 1, isExam: false },
          { name: "Prova 2", code: "P2", weight: 1, maxGrade: 10, orderIndex: 2, isExam: false },
        ]
  );

  // Live preview formula
  const formulaPreview = React.useMemo(() => {
    const regularComponents = components.filter((c) => !c.isExam);
    return formatGradingFormula(
      regularComponents.map((c) => ({ name: c.code, weight: c.weight }))
    );
  }, [components]);

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
      toast("A disciplina precisa de pelo menos uma avaliação.", "error");
      return;
    }
    setComponents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingScheme) return;

    // Check invalid weights
    if (components.some((c) => c.weight <= 0)) {
      setError("Todos os pesos das avaliações devem ser maiores que zero.");
      return;
    }

    setLoading(true);
    setError(null);

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
        setError(res.error || "Erro ao salvar sistema de notas.");
        return;
      }

      toast("Sistema de avaliação atualizado com sucesso!");
      router.refresh();
    } catch {
      setError("Erro inesperado ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  if (!gradingScheme) {
    return (
      <div className="p-6 rounded-lg border border-neutral-800 text-center text-sm text-neutral-400">
        Nenhum esquema de notas configurado.
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
      {error && (
        <div className="rounded-md bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Formula Preview Banner */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-900/80 border border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-950/60 border border-blue-800 text-blue-400">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-medium text-neutral-400">Fórmula de Cálculo da Média</div>
            <div className="text-base font-mono font-bold text-neutral-100 mt-0.5">
              Média = {formulaPreview}
            </div>
          </div>
        </div>

        <div className="text-right text-xs text-neutral-400">
          Média mínima: <strong className="text-neutral-100">{passingGrade}</strong>
        </div>
      </div>

      {/* Grade Components Configuration */}
      <Card className="border-neutral-800 bg-neutral-900/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Componentes de Avaliação</CardTitle>
              <CardDescription>
                Defina as provas e seus respectivos pesos para o cálculo ponderado.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddComponent}
              className="text-xs border-neutral-750"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Adicionar Prova/Trabalho
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {components.map((comp, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-3 rounded-md bg-neutral-950/60 border border-neutral-850"
            >
              <div className="w-16">
                <label className="block text-[10px] text-neutral-400 mb-1 font-mono">
                  Código
                </label>
                <Input
                  value={comp.code}
                  onChange={(e) => handleComponentChange(idx, "code", e.target.value)}
                  placeholder="P1"
                  className="font-mono text-center text-xs h-8 uppercase"
                  required
                />
              </div>

              <div className="flex-1">
                <label className="block text-[10px] text-neutral-400 mb-1">
                  Nome descritivo
                </label>
                <Input
                  value={comp.name}
                  onChange={(e) => handleComponentChange(idx, "name", e.target.value)}
                  placeholder="Ex: Prova Semestral 1"
                  className="text-xs h-8"
                  required
                />
              </div>

              <div className="w-24">
                <label className="block text-[10px] text-neutral-400 mb-1">
                  Peso (Weight)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={comp.weight}
                  onChange={(e) => handleComponentChange(idx, "weight", Number(e.target.value))}
                  className="text-xs h-8 text-center font-mono"
                  required
                />
              </div>

              <div className="w-24">
                <label className="block text-[10px] text-neutral-400 mb-1">
                  Nota Máx.
                </label>
                <Input
                  type="number"
                  step="0.5"
                  min="1"
                  value={comp.maxGrade}
                  onChange={(e) => handleComponentChange(idx, "maxGrade", Number(e.target.value))}
                  className="text-xs h-8 text-center font-mono"
                  required
                />
              </div>

              <button
                type="button"
                onClick={() => handleRemoveComponent(idx)}
                className="mt-4 p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
                title="Remover avaliação"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Rules & Thresholds */}
      <Card className="border-neutral-800 bg-neutral-900/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Critérios de Aprovação e Exame</CardTitle>
          <CardDescription>
            Parâmetros para aprovação direta e critérios de recuperação/exame final.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Média Mínima de Aprovação Direta
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={passingGrade}
                onChange={(e) => setPassingGrade(Number(e.target.value))}
                required
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                Nota necessária para aprovação sem necessidade de exame (padrão: 5.0).
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Nota Limite para Exame
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={examTriggerThreshold}
                onChange={(e) => setExamTriggerThreshold(Number(e.target.value))}
                required
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                Se a média for inferior a este valor, o exame final será sinalizado como obrigatório.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="examEnabled"
              checked={examEnabled}
              onChange={(e) => setExamEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-blue-600 focus:ring-neutral-400"
            />
            <label htmlFor="examEnabled" className="text-xs text-neutral-300 cursor-pointer">
              Permitir avaliação substitutiva / exame final nesta disciplina
            </label>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-md bg-neutral-950/60 border border-neutral-850 text-xs text-neutral-400">
            <Info className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
            <span>
              Nota: O cálculo pós-exame segue as diretrizes da sua instituição e será integrado conforme suas regras formais.
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="mr-1.5 h-4 w-4" />
              Salvar Configurações de Avaliação
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
