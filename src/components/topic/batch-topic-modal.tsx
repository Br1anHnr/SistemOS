"use client";

import * as React from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { batchCreateTopicsAction } from "@/actions/topic.actions";
import { Loader2, Wand2 } from "lucide-react";

interface BatchTopicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  assessments?: Array<{ id: string; title: string }>;
  onSuccess?: () => void;
}

export function BatchTopicModal({
  open,
  onOpenChange,
  subjectId,
  assessments = [],
  onSuccess,
}: BatchTopicModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [rawText, setRawText] = React.useState("");
  const [assessmentId, setAssessmentId] = React.useState<string>("");

  React.useEffect(() => {
    setRawText("");
    setAssessmentId("");
    setError(null);
  }, [open]);

  const parsedCount = React.useMemo(() => {
    return rawText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0).length;
  }, [rawText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedCount === 0) {
      setError("Cole pelo menos uma linha de conteúdo.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await batchCreateTopicsAction({
        subjectId,
        rawText,
        assessmentId: assessmentId || null,
      });

      if (!res.success) {
        setError(res.error || "Erro ao importar conteúdos.");
        return;
      }

      toast(`${res.count} tópicos cadastrados com sucesso!`);
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setError("Erro inesperado ao importar tópicos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-400" />
            Importar Ementa em Lote
          </DialogTitle>
          <DialogDescription>
            Cole a lista de conteúdos da sua ementa (um tópico por linha).
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
              Lista de Tópicos (um por linha) *
            </label>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Exemplo:\n1. Introdução e Conceitos Básicos\n2. Teorema Fundamental do Cálculo\n3. Regra de L'Hôpital\n4. Integrais por Substituição\n5. Integrais por Partes`}
              className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-mono text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
              required
              autoFocus
            />
            <p className="text-[11px] text-neutral-400 mt-1">
              Detectados: <strong className="text-neutral-200">{parsedCount}</strong> tópicos.
            </p>
          </div>

          {assessments.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Vincular todos a uma avaliação (opcional)
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

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading || parsedCount === 0}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              `Importar ${parsedCount} Tópicos`
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
