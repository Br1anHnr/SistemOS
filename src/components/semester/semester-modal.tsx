"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createSemesterAction, updateSemesterAction } from "@/actions/semester.actions";
import { Loader2 } from "lucide-react";

interface SemesterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterToEdit?: {
    id: string;
    name: string;
    academicYear: string;
    academicTerm: string;
    startDate: string;
    endDate: string;
    status: "PLANNED" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  } | null;
  onSuccess?: () => void;
}

export function SemesterModal({
  open,
  onOpenChange,
  semesterToEdit,
  onSuccess,
}: SemesterModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [academicYear, setAcademicYear] = React.useState(new Date().getFullYear().toString());
  const [academicTerm, setAcademicTerm] = React.useState("1º Semestre");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [status, setStatus] = React.useState<"PLANNED" | "ACTIVE" | "COMPLETED" | "ARCHIVED">("ACTIVE");

  React.useEffect(() => {
    if (semesterToEdit) {
      setName(semesterToEdit.name);
      setAcademicYear(semesterToEdit.academicYear);
      setAcademicTerm(semesterToEdit.academicTerm);
      setStartDate(semesterToEdit.startDate);
      setEndDate(semesterToEdit.endDate);
      setStatus(semesterToEdit.status);
    } else {
      const year = new Date().getFullYear().toString();
      setName(`${year}.1`);
      setAcademicYear(year);
      setAcademicTerm("1º Semestre");
      setStartDate(`${year}-02-01`);
      setEndDate(`${year}-06-30`);
      setStatus("ACTIVE");
    }
    setError(null);
  }, [semesterToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (semesterToEdit) {
        const res = await updateSemesterAction(semesterToEdit.id, {
          name,
          academicYear,
          academicTerm,
          startDate,
          endDate,
          status,
        });

        if (!res.success) {
          setError(res.error || "Erro ao atualizar semestre.");
          return;
        }

        toast("Semestre atualizado com sucesso!");
      } else {
        const res = await createSemesterAction({
          name,
          academicYear,
          academicTerm,
          startDate,
          endDate,
          status,
        });

        if (!res.success) {
          setError(res.error || "Erro ao criar semestre.");
          return;
        }

        toast("Semestre criado com sucesso!");
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
            {semesterToEdit ? "Editar Semestre" : "Novo Semestre"}
          </DialogTitle>
          <DialogDescription>
            {semesterToEdit
              ? "Altere os dados do período letivo."
              : "Cadastre um novo período acadêmico para organizar suas matérias."}
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
              Nome de identificação *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: 2026.1 ou 5º Semestre"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Ano Acadêmico *
              </label>
              <Input
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2026"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Período Letivo *
              </label>
              <Select
                value={academicTerm}
                onChange={(e) => setAcademicTerm(e.target.value)}
              >
                <option value="1º Semestre">1º Semestre</option>
                <option value="2º Semestre">2º Semestre</option>
                <option value="Anual">Anual</option>
                <option value="Outro">Outro</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Data Inicial *
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Data Final *
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Status *
            </label>
            <Select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "PLANNED" | "ACTIVE" | "COMPLETED" | "ARCHIVED")
              }
            >
              <option value="ACTIVE">Ativo (Semestre Atual)</option>
              <option value="PLANNED">Planejado (Futuro)</option>
              <option value="COMPLETED">Concluído</option>
              <option value="ARCHIVED">Arquivado</option>
            </Select>
            {status === "ACTIVE" && (
              <p className="text-xs text-neutral-400 mt-1">
                Ao ativar este semestre, o semestre ativo anterior será finalizado.
              </p>
            )}
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
            ) : semesterToEdit ? (
              "Salvar Alterações"
            ) : (
              "Criar Semestre"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
