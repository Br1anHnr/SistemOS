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
import { Loader2, Layers } from "lucide-react";
import { MASTERY_LEVELS } from "@/domain/topics";

export interface TopicToEdit {
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
}

interface TopicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  assessments?: Array<{ id: string; title: string }>;
  parentTopics?: Array<{ id: string; title: string }>;
  defaultParentId?: string | null;
  topicToEdit?: TopicToEdit | null;
  onSuccess?: () => void;
}

export function TopicModal({
  open,
  onOpenChange,
  subjectId,
  assessments = [],
  parentTopics = [],
  defaultParentId = null,
  topicToEdit,
  onSuccess,
}: TopicModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [parentId, setParentId] = React.useState<string>("");
  const [masteryLevel, setMasteryLevel] = React.useState<number>(0);
  const [importance, setImportance] = React.useState<number>(3);
  const [estimatedHours, setEstimatedHours] = React.useState<string>("");
  const [assessmentId, setAssessmentId] = React.useState<string>("");

  React.useEffect(() => {
    if (topicToEdit) {
      setTitle(topicToEdit.title);
      setDescription(topicToEdit.description || "");
      setParentId(topicToEdit.parentId || "");
      setMasteryLevel(topicToEdit.masteryLevel);
      setImportance(topicToEdit.importance);
      setEstimatedHours(
        topicToEdit.estimatedHours ? topicToEdit.estimatedHours.toString() : ""
      );
      setAssessmentId(topicToEdit.assessmentId || "");
    } else {
      setTitle("");
      setDescription("");
      setParentId(defaultParentId || "");
      setMasteryLevel(0);
      setImportance(3);
      setEstimatedHours("");
      setAssessmentId("");
    }
    setError(null);
  }, [topicToEdit, defaultParentId, open]);

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
          parentId: parentId || null,
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
          parentId: parentId || null,
          masteryLevel: Number(masteryLevel),
          importance: Number(importance),
          estimatedHours: parsedHours,
          assessmentId: assessmentId || null,
        });

        if (!res.success) {
          setError(res.error || "Erro ao cadastrar conteúdo.");
          return;
        }

        toast(parentId ? "Subtópico cadastrado com sucesso!" : "Tópico cadastrado com sucesso!");
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
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-400" />
            {topicToEdit
              ? "Editar Conteúdo"
              : parentId || defaultParentId
              ? "Novo Subtópico / Subconteúdo"
              : "Novo Tópico / Módulo Principal"}
          </DialogTitle>
          <DialogDescription>
            {topicToEdit
              ? "Modifique o tópico ou sua subcategoria."
              : parentId || defaultParentId
              ? "Cadastre um subconteúdo específico dentro do módulo principal."
              : "Cadastre um módulo ou tópico principal da disciplina."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 rounded-md bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-1">
          {/* Parent Category Selector */}
          {parentTopics.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Vincular como Subconteúdo de (opcional)
              </label>
              <Select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
              >
                <option value="">Nenhum (Tópico / Módulo Principal)</option>
                {parentTopics
                  .filter((p) => !topicToEdit || p.id !== topicToEdit.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      ↳ {p.title}
                    </option>
                  ))}
              </Select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Título do Conteúdo *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Lei de Fourier, Condução Unidimensional"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Descrição / Anotações Rápidas (opcional)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Slide 12 a 25 da aula, lista 2"
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
                placeholder="Ex: 2"
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
            ) : parentId ? (
              "Cadastrar Subtópico"
            ) : (
              "Cadastrar Tópico"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
