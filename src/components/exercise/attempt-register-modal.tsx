"use client";

import * as React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Upload,
  Trash2,
  Clock,
  Gauge,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createExerciseAttemptAction } from "@/actions/exercise.actions";
import { ExerciseAttemptResult } from "@/domain/exercises";
import { storeLocalFile, fileToDataUrl } from "@/lib/file-storage";

interface PendingPhoto {
  file: File;
  previewUrl: string;
  caption: string;
}

interface AttemptRegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseId: string;
  exerciseTitle: string;
  subjectId: string;
  onSuccess?: () => void;
}

export function AttemptRegisterModal({
  open,
  onOpenChange,
  exerciseId,
  exerciseTitle,
  subjectId,
  onSuccess,
}: AttemptRegisterModalProps) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [result, setResult] = React.useState<ExerciseAttemptResult>("CORRECT");
  const [durationMinutes, setDurationMinutes] = React.useState<string>("");
  const [difficultyPerceived, setDifficultyPerceived] = React.useState<number>(3);
  const [notes, setNotes] = React.useState<string>("");
  const [needsReview, setNeedsReview] = React.useState<boolean>(false);
  const [photos, setPhotos] = React.useState<PendingPhoto[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      setResult("CORRECT");
      setDurationMinutes("");
      setDifficultyPerceived(3);
      setNotes("");
      setNeedsReview(false);
      setPhotos([]);
      setLoading(false);
    }
  }, [open]);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: PendingPhoto[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      newPhotos.push({
        file,
        previewUrl,
        caption: `Página ${photos.length + i + 1} do caderno`,
      });
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const item = prev[index];
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleUpdateCaption = (index: number, caption: string) => {
    setPhotos((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, caption } : p))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Process photo attachments
      const attachments = [];
      for (const photo of photos) {
        const fileId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        let filePath = "";

        try {
          // Attempt persistent IndexedDB storage
          filePath = await storeLocalFile(fileId, photo.file);
        } catch {
          // Fallback to data URL
          filePath = await fileToDataUrl(photo.file);
        }

        attachments.push({
          type: "SOLUTION_IMAGE" as const,
          filePath,
          mimeType: photo.file.type || "image/png",
          originalName: photo.file.name,
          caption: photo.caption.trim() || null,
        });
      }

      const res = await createExerciseAttemptAction(
        {
          exerciseId,
          result,
          durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
          difficultyPerceived,
          notes: notes.trim() || null,
          needsReview,
          attachments,
        },
        subjectId
      );

      if (res.success) {
        toast("Tentativa registrada com sucesso!");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast(res.error || "Erro ao salvar tentativa.", "error");
      }
    } catch {
      toast("Erro ao registrar tentativa.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-100">
              Registrar Tentativa
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-sm">
              {exerciseTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-neutral-400 hover:text-white p-1 rounded-md"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Result Selector */}
          <div>
            <label className="block text-neutral-300 font-medium mb-2">
              Como foi a resolução?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setResult("CORRECT")}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left font-medium transition-all ${
                  result === "CORRECT"
                    ? "bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800/60"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-neutral-200">Acertei</div>
                  <div className="text-[10px] text-neutral-400">Resolução 100% correta</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setResult("PARTIALLY_CORRECT")}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left font-medium transition-all ${
                  result === "PARTIALLY_CORRECT"
                    ? "bg-amber-950/60 border-amber-500 text-amber-300 ring-1 ring-amber-500"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800/60"
                }`}
              >
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-neutral-200">Parcial</div>
                  <div className="text-[10px] text-neutral-400">Acertei parte da questão</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setResult("INCORRECT");
                  setNeedsReview(true);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left font-medium transition-all ${
                  result === "INCORRECT"
                    ? "bg-rose-950/60 border-rose-500 text-rose-300 ring-1 ring-rose-500"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800/60"
                }`}
              >
                <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <div>
                  <div className="text-neutral-200">Errei</div>
                  <div className="text-[10px] text-neutral-400">Resultado incorreto</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setResult("NOT_COMPLETED");
                  setNeedsReview(true);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left font-medium transition-all ${
                  result === "NOT_COMPLETED"
                    ? "bg-purple-950/60 border-purple-500 text-purple-300 ring-1 ring-purple-500"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800/60"
                }`}
              >
                <HelpCircle className="h-4 w-4 text-purple-400 shrink-0" />
                <div>
                  <div className="text-neutral-200">Não consegui</div>
                  <div className="text-[10px] text-neutral-400">Travei na resolução</div>
                </div>
              </button>
            </div>
          </div>

          {/* Time & Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-300 font-medium mb-1.5 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-neutral-400" />
                Tempo gasto (minutos)
              </label>
              <Input
                type="number"
                min="0"
                placeholder="Ex: 15"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-neutral-100 text-xs h-9"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1.5 flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5 text-neutral-400" />
                Dificuldade percebida (1 a 5)
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficultyPerceived(lvl)}
                    className={`flex-1 h-9 rounded-md text-xs font-semibold transition-colors ${
                      difficultyPerceived === lvl
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-neutral-950 text-neutral-400 border border-neutral-800 hover:bg-neutral-800 hover:text-white"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preciso Refazer Checkbox */}
          <div className="p-3 bg-neutral-950/60 rounded-lg border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-amber-400" />
              <div>
                <div className="font-medium text-neutral-200">Marcar para refazer</div>
                <div className="text-[10px] text-neutral-400">
                  O exercício ficará sinalizado na lista de revisão
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={needsReview}
              onChange={(e) => setNeedsReview(e.target.checked)}
              className="h-4 w-4 rounded bg-neutral-900 border-neutral-700 text-purple-600 focus:ring-purple-500 cursor-pointer"
            />
          </div>

          {/* Observations */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1.5">
              Observações / Dicas da resolução (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Cuidado com a conversão de unidades no passo 3..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-md p-2.5 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-purple-500 resize-none text-xs"
            />
          </div>

          {/* Upload de Fotos da Resolução do Caderno */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-neutral-300 font-medium flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-neutral-400" />
                Fotos da Resolução no Caderno
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 text-xs border-purple-800/60 text-purple-300 hover:bg-purple-950/40"
              >
                + Adicionar Fotos
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              multiple
              onChange={handleFilesSelected}
              className="hidden"
            />

            {photos.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-neutral-800 rounded-lg p-4 text-center cursor-pointer hover:border-purple-500/50 transition-colors bg-neutral-950/40"
              >
                <p className="text-neutral-400 text-xs">
                  Tire uma foto do caderno e anexe para registrar sua resolução.
                </p>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Suporta PNG, JPG, WEBP
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {photos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 bg-neutral-950 rounded-lg border border-neutral-800"
                  >
                    <img
                      src={photo.previewUrl}
                      alt="Prévia"
                      className="h-12 w-12 object-cover rounded border border-neutral-800 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <Input
                        type="text"
                        placeholder="Legenda da foto (ex: Página 1)"
                        value={photo.caption}
                        onChange={(e) => handleUpdateCaption(idx, e.target.value)}
                        className="bg-neutral-900 border-neutral-800 text-xs h-7 text-neutral-200"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors"
                      title="Remover foto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-neutral-400 hover:text-white text-xs h-9"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs h-9 px-4"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Salvando...
                </>
              ) : (
                "Salvar Tentativa"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
