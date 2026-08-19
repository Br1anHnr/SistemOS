"use client";

import * as React from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createTopicAction, updateTopicAction } from "@/actions/topic.actions";
import { Loader2 } from "lucide-react";
import { MASTERY_LEVELS } from "@/domain/topics";

export interface TopicToEdit {
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
}

interface TopicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  assessments?: Array<{ id: string; title: string }>;
  topicToEdit?: TopicToEdit | null;
  onSuccess?: () => void;
}

export function TopicModal({
  open,
  onOpenChange,
  subjectId,
  assessments = [],
  topicToEdit,
  onSuccess,
}: TopicModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [masteryLevel, setMasteryLevel] = React.useState<number>(0);
  const [importance, setImportance] = React.useState<number>(3);
  const [estimatedHours, setEstimatedHours] = React.useState<string>("");
  const [assessmentId, setAssessmentId] = React.useState<string>("");

  React.useEffect(() => {
    if (topicToEdit) {
      setTitle(topicToEdit.title);
      setDescription(topicToEdit.description || "");
      setMasteryLevel(topicToEdit.masteryLevel);
      setImportance(topicToEdit.importance);
      setEstimatedHours(
        topicToEdit.estimatedHours ? topicToEdit.estimatedHours.toString() : ""
      );
      setAssessmentId(topicToEdit.assessmentId || "");
    } else {
      setTitle("");
      setDescription("");
      setMasteryLevel(0);
      setImportance(3);
      setEstimatedHours("");
      setAssessmentId("");
    }
    setError(null);
  }, [topicToEdit, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const parsedHours = estimatedHours !== "" ? Number(estimatedHours) : null;

      if (topicToEdit) {
        const res = await updateTopicAction(topicToEdit.id, subjectId, {
          title,
          description: description || null,
          masteryLevel: Number(masteryLevel),
          importance: Number(importance),
          estimatedHours: parsedHours,
          assessmentId: assessmentId || null,
        });

        if (!res.success) {
          setError(res.error || "Erro ao atualizar conteúdo.");
          return;
        }

        toast("Conteúdo atualizado com sucesso!");
      } else {
        const res = await createTopicAction({
          subjectId,
          title,
          description: description || null,
          masteryLevel: Number(masteryLevel),
          importance: Number(importance),
          estimatedHours: parsedHours,
          assessmentId: assessmentId || null,
        });

        if (!res.success) {
          setError(res.error || "Erro ao cadastrar conteúdo.");
          return;
        }

        toast("Conteúdo cadastrado com sucesso!");
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
            {topicToEdit ? "Editar Conteúdo" : "Novo Tópico / Conteúdo"}
          </DialogTitle>
          <DialogDescription>
            {topicToEdit
              ? "Modifique o tópico da ementa e seu nível de domínio."
              : "Cadastre um tópico da matéria para planejar seus estudos."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 rounded-md bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Título do Conteúdo *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Teorema de Pitágoras, Regra da Cadeia"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Descrição / Subtópicos (opcional)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Seção 2.3 do livro, exercícios 1 a 15"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Nível de Domínio (0 a 4)
              </label>
              <Select
                value={masteryLevel.toString()}
                onChange={(e) => setMasteryLevel(Number(e.target.value))}
              >
                {MASTERY_LEVELS.map((m) => (
                  <option key={m.level} value={m.level.toString()}>
                    {m.level} — {m.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Importância (1 a 5)
              </label>
              <Select
                value={importance.toString()}
                onChange={(e) => setImportance(Number(e.target.value))}
              >
                <option value="1">1 — Baixa / Conceitual</option>
                <option value="2">2 — Secundária</option>
                <option value="3">3 — Média / Padrão</option>
                <option value="4">4 — Alta / Muito Cobrado</option>
                <option value="5">5 — Crítica / Essencial</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Horas Estimadas de Estudo
              </label>
              <Input
                type="number"
                step="any"
                min="0"
                max="100"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="Ex: 3"
              />
            </div>

            {assessments.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Cobrado na Avaliação
                </label>
                <Select
                  value={assessmentId}
                  onChange={(e) => setAssessmentId(e.target.value)}
                >
                  <option value="">Nenhuma (geral)</option>
                  {assessments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title}
                    </option>
                  ))}
                </Select>
              </div>
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
            ) : topicToEdit ? (
              "Salvar Alterações"
            ) : (
              "Cadastrar Tópico"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
