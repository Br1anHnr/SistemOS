"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { saveGradeAction, deleteGradeAction } from "@/actions/assessment.actions";
import { Loader2, Trash2, Check } from "lucide-react";

interface GradeInputModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: {
    id: string;
    title: string;
    maxGrade: number;
    subjectId: string;
    result?: { grade: number; notes?: string | null } | null;
  } | null;
  onSuccess?: () => void;
}

export function GradeInputModal({
  open,
  onOpenChange,
  assessment,
  onSuccess,
}: GradeInputModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [grade, setGrade] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");

  React.useEffect(() => {
    if (assessment?.result) {
      setGrade(assessment.result.grade.toString());
      setNotes(assessment.result.notes || "");
    } else {
      setGrade("");
      setNotes("");
    }
    setError(null);
  }, [assessment, open]);

  if (!assessment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const parsed = Number(grade);
    if (isNaN(parsed) || parsed < 0 || parsed > assessment.maxGrade) {
      setError(`A nota deve ser entre 0 e ${assessment.maxGrade}.`);
      setLoading(false);
      return;
    }

    try {
      const res = await saveGradeAction(
        {
          assessmentId: assessment.id,
          grade: parsed,
          notes: notes || null,
        },
        assessment.subjectId
      );

      if (!res.success) {
        setError(res.error || "Erro ao registrar nota.");
        return;
      }

      toast("Nota registrada com sucesso!");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setError("Erro inesperado ao salvar nota.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGrade = async () => {
    if (!confirm("Deseja remover a nota desta avaliação?")) return;
    setLoading(true);
    try {
      const res = await deleteGradeAction(assessment.id, assessment.subjectId);
      if (res.success) {
        toast("Nota removida.");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast(res.error || "Erro ao remover nota.", "error");
      }
    } catch {
      toast("Erro ao remover nota.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Lançar Nota</DialogTitle>
          <DialogDescription>
            Informe a nota obtida em <strong>{assessment.title}</strong> (Nota máxima: {assessment.maxGrade}).
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 rounded-md bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Nota Obtida (0 a {assessment.maxGrade}) *
            </label>
            <Input
              type="number"
              step="any"
              min="0"
              max={assessment.maxGrade}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="Ex: 8.5"
              className="text-lg font-bold font-mono h-11"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Comentários / Observações do Professor
            </label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Bom raciocínio na questão 3"
            />
          </div>
        </div>

        <DialogFooter>
          {assessment.result && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleRemoveGrade}
              disabled={loading}
              className="text-xs text-neutral-400 hover:text-red-400 sm:mr-auto"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Remover Nota
            </Button>
          )}

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
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Salvar Nota
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
