"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createAssessmentAction, updateAssessmentAction } from "@/actions/assessment.actions";
import { Loader2 } from "lucide-react";

interface AssessmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  gradeComponents?: Array<{ id: string; name: string; code: string }>;
  assessmentToEdit?: {
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
  } | null;
  onSuccess?: () => void;
}

export function AssessmentModal({
  open,
  onOpenChange,
  subjectId,
  gradeComponents = [],
  assessmentToEdit,
  onSuccess,
}: AssessmentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<"EXAM" | "FINAL_EXAM" | "ASSIGNMENT" | "OTHER">("EXAM");
  const [gradeComponentId, setGradeComponentId] = React.useState<string>("");
  const [date, setDate] = React.useState<string>("");
  const [maxGrade, setMaxGrade] = React.useState<number>(10);
  const [grade, setGrade] = React.useState<string>("");
  const [status, setStatus] = React.useState<"SCHEDULED" | "COMPLETED" | "CANCELED">("SCHEDULED");
  const [notes, setNotes] = React.useState("");

  React.useEffect(() => {
    if (assessmentToEdit) {
      setTitle(assessmentToEdit.title);
      setType(assessmentToEdit.type);
      setGradeComponentId(assessmentToEdit.gradeComponentId || "");
      setDate(assessmentToEdit.date || "");
      setMaxGrade(assessmentToEdit.maxGrade);
      setGrade(
        assessmentToEdit.result ? assessmentToEdit.result.grade.toString() : ""
      );
      setStatus(assessmentToEdit.status);
      setNotes(assessmentToEdit.notes || "");
    } else {
      setTitle("");
      setType("EXAM");
      setGradeComponentId(gradeComponents[0]?.id || "");
      setDate(new Date().toISOString().split("T")[0]);
      setMaxGrade(10);
      setGrade("");
      setStatus("SCHEDULED");
      setNotes("");
    }
    setError(null);
  }, [assessmentToEdit, gradeComponents, open]);

  // When selecting a grade component, auto-fill title if empty
  const handleComponentChange = (id: string) => {
    setGradeComponentId(id);
    const comp = gradeComponents.find((c) => c.id === id);
    if (comp && !title) {
      setTitle(comp.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const parsedGrade = grade !== "" ? Number(grade) : null;

      if (assessmentToEdit) {
        const res = await updateAssessmentAction(assessmentToEdit.id, subjectId, {
          gradeComponentId: gradeComponentId || null,
          title,
          type,
          date: date || null,
          maxGrade: Number(maxGrade),
          status,
          notes: notes || null,
        });

        if (!res.success) {
          setError(res.error || "Erro ao atualizar avaliação.");
          return;
        }

        toast("Avaliação atualizada com sucesso!");
      } else {
        const res = await createAssessmentAction({
          subjectId,
          gradeComponentId: gradeComponentId || null,
          title,
          type,
          date: date || null,
          maxGrade: Number(maxGrade),
          status,
          notes: notes || null,
          grade: parsedGrade,
        });

        if (!res.success) {
          setError(res.error || "Erro ao cadastrar avaliação.");
          return;
        }

        toast("Avaliação cadastrada com sucesso!");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch {
      setError("Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>
            {assessmentToEdit ? "Editar Avaliação" : "Nova Avaliação"}
          </DialogTitle>
          <DialogDescription>
            {assessmentToEdit
              ? "Modifique os dados da prova ou trabalho."
              : "Agende uma prova, entrega ou registre a nota obtida."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 rounded-md bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-1">
          {gradeComponents.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Vincular ao Componente de Nota
              </label>
              <Select
                value={gradeComponentId}
                onChange={(e) => handleComponentChange(e.target.value)}
              >
                <option value="">Nenhum (avaliação livre / extra)</option>
                {gradeComponents.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.code} — {comp.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Título da Avaliação *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Prova 1 (P1), Trabalho Bimestral"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Tipo
              </label>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
              >
                <option value="EXAM">Prova / Exame Parcial</option>
                <option value="FINAL_EXAM">Exame Final / Substitutiva</option>
                <option value="ASSIGNMENT">Trabalho / Projeto</option>
                <option value="OTHER">Outro</option>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Data Prevista
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Nota Máxima
              </label>
              <Input
                type="number"
                step="0.5"
                min="0.1"
                max="100"
                value={maxGrade}
                onChange={(e) => setMaxGrade(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Nota Obtida (opcional)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={maxGrade}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                placeholder="Deixe em branco se pendente"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Observações / Conteúdo cobrado
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Capítulos 1 a 4, trazer calculadora"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : assessmentToEdit ? (
              "Salvar Alterações"
            ) : (
              "Cadastrar Avaliação"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
