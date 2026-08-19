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
  ChevronDown,
  ChevronUp,
  Camera,
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
  const [photos, setPhotos] = React.useState<PendingPhoto[]>([]);
  const [notes, setNotes] = React.useState<string>("");
  const [needsReview, setNeedsReview] = React.useState<boolean>(false);

  // Secondary fields (collapsible)
  const [showMoreDetails, setShowMoreDetails] = React.useState<boolean>(false);
  const [durationMinutes, setDurationMinutes] = React.useState<string>("");
  const [difficultyPerceived, setDifficultyPerceived] = React.useState<number>(3);

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
      setShowMoreDetails(false);
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
      // Store attached photos in local file storage
      const attachments = [];
      for (const photo of photos) {
        const fileId = `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        let filePath = "";
        try {
          filePath = await storeLocalFile(fileId, photo.file);
        } catch {
          filePath = await fileToDataUrl(photo.file);
        }

        attachments.push({
          type: "SOLUTION_IMAGE" as const,
          filePath,
          mimeType: photo.file.type || "image/jpeg",
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
        toast(res.error || "Erro ao registrar tentativa.", "error");
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
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-neutral-100">
              Registrar Resolução
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-sm">
              {exerciseTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-neutral-400 hover:text-white p-1 rounded-md ml-2"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Result Selector */}
          <div>
            <label className="block text-neutral-300 font-medium mb-2">
              Resultado da Resolução
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setResult("CORRECT")}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left font-medium transition-all ${
                  result === "CORRECT"
                    ? "bg-emerald-950/70 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500 shadow-sm"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800/60"
                }`}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-neutral-200 font-semibold">Acertei</div>
                  <div className="text-[10px] text-neutral-400">Resolução correta</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setResult("PARTIALLY_CORRECT")}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-left font-medium transition-all ${
                  result === "PARTIALLY_CORRECT"
                    ? "bg-amber-950/70 border-amber-500 text-amber-300 ring-1 ring-amber-500 shadow-sm"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800/60"
                }`}
              >
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <div>
                  <div className="text-neutral-200 font-semibold">Parcial</div>
                  <div className="text-[10px] text-neutral-400">Acertei parte</div>
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
                    ? "bg-rose-950/70 border-rose-500 text-rose-300 ring-1 ring-rose-500 shadow-sm"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800/60"
                }`}
              >
                <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <div>
                  <div className="text-neutral-200 font-semibold">Errei</div>
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
                    ? "bg-purple-950/70 border-purple-500 text-purple-300 ring-1 ring-purple-500 shadow-sm"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:bg-neutral-800/60"
                }`}
              >
                <HelpCircle className="h-4 w-4 text-purple-400 shrink-0" />
                <div>
                  <div className="text-neutral-200 font-semibold">Não consegui</div>
                  <div className="text-[10px] text-neutral-400">Travei no problema</div>
                </div>
              </button>
            </div>
          </div>

          {/* Fotos da Resolução do Caderno */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-neutral-200 font-semibold text-xs flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-purple-400" />
                Fotos da Resolução no Caderno
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-6 text-[11px] border-purple-800/70 text-purple-300 hover:bg-purple-950/40 gap-1"
              >
                <Upload className="h-3 w-3" />
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
                className="border border-dashed border-neutral-800 hover:border-purple-500/50 rounded-lg p-4 text-center cursor-pointer bg-neutral-950/40 transition-colors"
              >
                <p className="text-neutral-400 text-xs">
                  Tire uma foto do caderno ou rascunho e anexe aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {photos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-neutral-950 rounded-lg border border-neutral-800"
                  >
                    <img
                      src={photo.previewUrl}
                      alt="Prévia"
                      className="h-12 w-12 object-cover rounded border border-neutral-800 shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <Input
                        value={photo.caption}
                        onChange={(e) => handleUpdateCaption(idx, e.target.value)}
                        placeholder="Legenda (ex: Passo 1, Equação final)"
                        className="h-7 text-[11px] bg-neutral-900 border-neutral-800 text-neutral-200"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="p-1 text-neutral-500 hover:text-red-400"
                      title="Remover foto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Observations */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Observação / Dica da Resolução <span className="text-neutral-500 font-normal">(opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Cuidado com a conversão de unidades no passo 3..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500 resize-none text-xs"
            />
          </div>

          {/* Preciso Refazer Checkbox */}
          <div className="p-2.5 bg-neutral-950/60 rounded-lg border border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-3.5 w-3.5 text-amber-400" />
              <div>
                <div className="font-medium text-neutral-200 text-[11px]">Marcar para refazer</div>
                <div className="text-[10px] text-neutral-500">
                  Ficará sinalizado na lista para revisão futura
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

          {/* Collapsible Secondary Details (Time & Difficulty) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMoreDetails((prev) => !prev)}
              className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-200 text-xs font-medium py-1 transition-colors"
            >
              {showMoreDetails ? (
                <ChevronUp className="h-3.5 w-3.5 text-purple-400" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
              )}
              <span>{showMoreDetails ? "Ocultar detalhes" : "Mais detalhes (tempo gasto, dificuldade estimada)"}</span>
            </button>

            {showMoreDetails && (
              <div className="mt-2 p-3 bg-neutral-950/70 border border-neutral-800/80 rounded-lg grid grid-cols-2 gap-3 animate-in fade-in duration-150">
                <div>
                  <label className="block text-neutral-400 font-medium mb-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Tempo gasto (minutos)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Ex: 15"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    className="bg-neutral-900 border-neutral-800 text-neutral-100 text-xs h-8"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 font-medium mb-1 flex items-center gap-1">
                    <Gauge className="h-3 w-3" />
                    Dificuldade (1 a 5)
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setDifficultyPerceived(lvl)}
                        className={`flex-1 h-8 rounded text-xs font-semibold transition-colors ${
                          difficultyPerceived === lvl
                            ? "bg-purple-600 text-white shadow-sm"
                            : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
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
              className="bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs h-9 px-4 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Salvando...
                </>
              ) : (
                "Salvar Resolução"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
