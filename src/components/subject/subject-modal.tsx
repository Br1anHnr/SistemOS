"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createSubjectAction, updateSubjectAction } from "@/actions/subject.actions";
import { Loader2 } from "lucide-react";

interface SubjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSemesterId?: string;
  availableSemesters?: Array<{ id: string; name: string }>;
  subjectToEdit?: {
    id: string;
    semesterId: string;
    name: string;
    code?: string | null;
    professor?: string | null;
    room?: string | null;
    workloadHours?: number | null;
    minimumAttendancePercentage: number;
    personalDifficulty: number;
    color?: string | null;
    status: "ACTIVE" | "COMPLETED" | "FAILED" | "DROPPED" | "ARCHIVED";
  } | null;
  onSuccess?: () => void;
}

const COLOR_PRESETS = [
  { label: "Azul", value: "#3b82f6" },
  { label: "Roxo", value: "#8b5cf6" },
  { label: "Esmeralda", value: "#10b981" },
  { label: "Âmbar", value: "#f59e0b" },
  { label: "Rosa", value: "#ec4899" },
  { label: "Ciano", value: "#06b6d4" },
  { label: "Vermelho", value: "#ef4444" },
  { label: "Cinza", value: "#64748b" },
];

export function SubjectModal({
  open,
  onOpenChange,
  defaultSemesterId,
  availableSemesters = [],
  subjectToEdit,
  onSuccess,
}: SubjectModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [semesterId, setSemesterId] = React.useState(defaultSemesterId || "");
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [professor, setProfessor] = React.useState("");
  const [room, setRoom] = React.useState("");
  const [workloadHours, setWorkloadHours] = React.useState<string>("");
  const [minimumAttendancePercentage, setMinimumAttendancePercentage] = React.useState<number>(75);
  const [personalDifficulty, setPersonalDifficulty] = React.useState<number>(3);
  const [color, setColor] = React.useState("#3b82f6");
  const [status, setStatus] = React.useState<"ACTIVE" | "COMPLETED" | "FAILED" | "DROPPED" | "ARCHIVED">("ACTIVE");

  React.useEffect(() => {
    if (subjectToEdit) {
      setSemesterId(subjectToEdit.semesterId);
      setName(subjectToEdit.name);
      setCode(subjectToEdit.code || "");
      setProfessor(subjectToEdit.professor || "");
      setRoom(subjectToEdit.room || "");
      setWorkloadHours(subjectToEdit.workloadHours ? subjectToEdit.workloadHours.toString() : "");
      setMinimumAttendancePercentage(subjectToEdit.minimumAttendancePercentage);
      setPersonalDifficulty(subjectToEdit.personalDifficulty);
      setColor(subjectToEdit.color || "#3b82f6");
      setStatus(subjectToEdit.status);
    } else {
      setSemesterId(defaultSemesterId || (availableSemesters[0]?.id || ""));
      setName("");
      setCode("");
      setProfessor("");
      setRoom("");
      setWorkloadHours("");
      setMinimumAttendancePercentage(75);
      setPersonalDifficulty(3);
      setColor("#3b82f6");
      setStatus("ACTIVE");
    }
    setError(null);
  }, [subjectToEdit, defaultSemesterId, availableSemesters, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!semesterId) {
      setError("É necessário selecionar um semestre.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsedHours = workloadHours ? parseInt(workloadHours, 10) : undefined;

      if (subjectToEdit) {
        const res = await updateSubjectAction(subjectToEdit.id, {
          name,
          code: code || null,
          professor: professor || null,
          room: room || null,
          workloadHours: parsedHours,
          minimumAttendancePercentage,
          personalDifficulty,
          color,
          status,
        });

        if (!res.success) {
          setError(res.error || "Erro ao atualizar disciplina.");
          return;
        }

        toast("Disciplina atualizada com sucesso!");
      } else {
        const res = await createSubjectAction({
          semesterId,
          name,
          code: code || null,
          professor: professor || null,
          room: room || null,
          workloadHours: parsedHours,
          minimumAttendancePercentage,
          personalDifficulty,
          color,
          status,
        });

        if (!res.success) {
          setError(res.error || "Erro ao criar disciplina.");
          return;
        }

        toast("Disciplina criada com sucesso!");
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
            {subjectToEdit ? "Editar Disciplina" : "Nova Disciplina"}
          </DialogTitle>
          <DialogDescription>
            {subjectToEdit
              ? "Atualize as informações da matéria."
              : "Cadastre uma nova matéria no seu semestre letivo."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 rounded-md bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-1">
          {availableSemesters.length > 1 && !subjectToEdit && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Semestre *
              </label>
              <Select
                value={semesterId}
                onChange={(e) => setSemesterId(e.target.value)}
                required
              >
                {availableSemesters.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Nome da Disciplina *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Cálculo I, Redes de Computadores"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Código (opcional)
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: MAT01, INF20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Professor (opcional)
              </label>
              <Input
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
                placeholder="Nome do docente"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Sala / Bloco (opcional)
              </label>
              <Input
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Ex: Sala 304, Lab 2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Carga Horária Total (horas)
              </label>
              <Input
                type="number"
                min="1"
                value={workloadHours}
                onChange={(e) => setWorkloadHours(e.target.value)}
                placeholder="Ex: 60"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Frequência Mínima (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={minimumAttendancePercentage}
                onChange={(e) => setMinimumAttendancePercentage(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Dificuldade Pessoal (1 a 5)
              </label>
              <Select
                value={personalDifficulty.toString()}
                onChange={(e) => setPersonalDifficulty(Number(e.target.value))}
              >
                <option value="1">1 — Muito Fácil</option>
                <option value="2">2 — Fácil</option>
                <option value="3">3 — Média</option>
                <option value="4">4 — Difícil</option>
                <option value="5">5 — Muito Desafiadora</option>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Cor de identificação
            </label>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setColor(p.value)}
                  className={`h-6 w-6 rounded-full transition-transform ${
                    color === p.value ? "ring-2 ring-neutral-100 scale-110" : "opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: p.value }}
                  title={p.label}
                />
              ))}
            </div>
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
            ) : subjectToEdit ? (
              "Salvar Alterações"
            ) : (
              "Criar Disciplina"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
