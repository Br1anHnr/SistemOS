"use client";

import * as React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Sparkles,
  Plus,
  Trash2,
  Check,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExerciseItem } from "@/domain/exercises";

interface ExerciseMappingLayerProps {
  pageWidth: number;
  pageHeight: number;
  pageNumber: number;
  isMappingMode: boolean;
  exercises: ExerciseItem[];
  selectedExerciseId?: string | null;
  suggestedReference?: string;
  topicsList?: { id: string; title: string }[];
  onConfirmNewExercise: (data: {
    referenceNumber: string;
    topicId?: string | null;
    region: {
      x: number;
      y: number;
      width: number;
      height: number;
      pageNumber: number;
    };
  }) => Promise<void>;
  onSelectExercise: (exercise: ExerciseItem) => void;
  onAddRegionToExercise?: (
    exerciseId: string,
    region: {
      x: number;
      y: number;
      width: number;
      height: number;
      pageNumber: number;
    }
  ) => Promise<void>;
}

export function ExerciseMappingLayer({
  pageWidth,
  pageHeight,
  pageNumber,
  isMappingMode,
  exercises,
  selectedExerciseId,
  suggestedReference = "Q01",
  topicsList = [],
  onConfirmNewExercise,
  onSelectExercise,
  onAddRegionToExercise,
}: ExerciseMappingLayerProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Dragging state
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = React.useState<{ x: number; y: number } | null>(null);

  // Active Pending Region for Confirmation Popover
  const [pendingRegion, setPendingRegion] = React.useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    pageNumber: number;
  } | null>(null);

  const [refInput, setRefInput] = React.useState<string>(suggestedReference);
  const [selectedTopicId, setSelectedTopicId] = React.useState<string>("");
  const [attachToExistingId, setAttachToExistingId] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Update refInput whenever suggestedReference changes and no active modal
  React.useEffect(() => {
    if (!pendingRegion) {
      setRefInput(suggestedReference);
    }
  }, [suggestedReference, pendingRegion]);

  const getNormalizedPoint = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    return {
      x: Math.max(0, Math.min(1, rawX / rect.width)),
      y: Math.max(0, Math.min(1, rawY / rect.height)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMappingMode || pendingRegion) return;
    e.stopPropagation();
    const point = getNormalizedPoint(e);
    setIsDragging(true);
    setDragStart(point);
    setDragCurrent(point);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !isMappingMode) return;
    e.stopPropagation();
    const point = getNormalizedPoint(e);
    setDragCurrent(point);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart || !dragCurrent) return;
    setIsDragging(false);

    const x = Math.min(dragStart.x, dragCurrent.x);
    const y = Math.min(dragStart.y, dragCurrent.y);
    const width = Math.abs(dragCurrent.x - dragStart.x);
    const height = Math.abs(dragCurrent.y - dragStart.y);

    setDragStart(null);
    setDragCurrent(null);

    // Minimum region threshold (2% width and height)
    if (width > 0.02 && height > 0.02) {
      setPendingRegion({
        x,
        y,
        width,
        height,
        pageNumber,
      });
      setRefInput(suggestedReference);
      setAttachToExistingId("");
    }
  };

  const handleConfirm = async () => {
    if (!pendingRegion || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (attachToExistingId && onAddRegionToExercise) {
        await onAddRegionToExercise(attachToExistingId, pendingRegion);
      } else {
        await onConfirmNewExercise({
          referenceNumber: refInput.trim() || suggestedReference,
          topicId: selectedTopicId || null,
          region: pendingRegion,
        });
      }
      setPendingRegion(null);
      setAttachToExistingId("");
    } catch {
      // Handled by toast in caller
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find all regions belonging to this page
  const pageRegions = React.useMemo(() => {
    const list: {
      exercise: ExerciseItem;
      region: {
        id: string;
        x: number;
        y: number;
        width: number;
        height: number;
        pageNumber: number;
        orderIndex: number;
      };
    }[] = [];

    for (const ex of exercises) {
      if (ex.sourceRegions) {
        for (const sr of ex.sourceRegions) {
          if (sr.pageNumber === pageNumber) {
            list.push({ exercise: ex, region: sr });
          }
        }
      }
    }
    return list;
  }, [exercises, pageNumber]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ width: `${pageWidth}px`, height: `${pageHeight}px` }}
      className={`absolute inset-0 select-none z-20 ${
        isMappingMode ? "cursor-crosshair pointer-events-auto" : "pointer-events-auto"
      }`}
    >
      {/* 1. Render Existing Mapped Regions on this Page */}
      {pageRegions.map(({ exercise, region }) => {
        const isSelected = selectedExerciseId === exercise.id;
        const left = region.x * pageWidth;
        const top = region.y * pageHeight;
        const width = region.width * pageWidth;
        const height = region.height * pageHeight;

        let statusBorderColor = "border-purple-500/70 bg-purple-500/10";
        let statusBadgeBg = "bg-purple-900 border-purple-700 text-purple-200";

        if (exercise.status === "RESOLVED") {
          statusBorderColor = "border-emerald-500/80 bg-emerald-500/10";
          statusBadgeBg = "bg-emerald-950 border-emerald-700 text-emerald-300";
        } else if (exercise.status === "PARTIALLY_CORRECT") {
          statusBorderColor = "border-amber-500/80 bg-amber-500/10";
          statusBadgeBg = "bg-amber-950 border-amber-700 text-amber-300";
        } else if (exercise.status === "WRONG") {
          statusBorderColor = "border-rose-500/80 bg-rose-500/10";
          statusBadgeBg = "bg-rose-950 border-rose-700 text-rose-300";
        } else if (exercise.status === "REVIEW") {
          statusBorderColor = "border-purple-500 ring-2 ring-purple-400 bg-purple-500/20";
          statusBadgeBg = "bg-purple-950 border-purple-600 text-purple-300";
        }

        return (
          <div
            key={region.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectExercise(exercise);
            }}
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: `${width}px`,
              height: `${height}px`,
            }}
            className={`absolute border-2 rounded transition-all cursor-pointer group ${statusBorderColor} ${
              isSelected ? "ring-2 ring-white shadow-lg z-30" : "hover:ring-1 hover:ring-purple-400"
            }`}
          >
            {/* Tag Badge */}
            <div
              className={`absolute -top-3 left-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold shadow border flex items-center gap-1 ${statusBadgeBg}`}
            >
              <span>{exercise.referenceNumber || exercise.title.slice(0, 10)}</span>
              {exercise.status === "RESOLVED" && <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />}
              {exercise.status === "REVIEW" && <RotateCcw className="h-2.5 w-2.5 text-purple-400" />}
            </div>
          </div>
        );
      })}

      {/* 2. Live Drag Rectangle */}
      {isDragging && dragStart && dragCurrent && (
        <div
          style={{
            left: `${Math.min(dragStart.x, dragCurrent.x) * pageWidth}px`,
            top: `${Math.min(dragStart.y, dragCurrent.y) * pageHeight}px`,
            width: `${Math.abs(dragCurrent.x - dragStart.x) * pageWidth}px`,
            height: `${Math.abs(dragCurrent.y - dragStart.y) * pageHeight}px`,
          }}
          className="absolute border-2 border-dashed border-purple-400 bg-purple-500/20 rounded shadow-md pointer-events-none z-40"
        >
          <div className="absolute -top-5 left-1 bg-purple-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow">
            Mapeando questão...
          </div>
        </div>
      )}

      {/* 3. Quick Confirmation Floating Popover */}
      {pendingRegion && (
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            left: `${Math.min(pageWidth - 260, Math.max(10, pendingRegion.x * pageWidth))}px`,
            top: `${Math.min(pageHeight - 200, Math.max(10, (pendingRegion.y + pendingRegion.height) * pageHeight + 8))}px`,
          }}
          className="absolute z-50 bg-neutral-900 border border-purple-500/80 rounded-xl p-3.5 shadow-2xl w-64 space-y-2.5 text-xs animate-in zoom-in-95 duration-100"
        >
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-100 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              Mapear Questão
            </span>
            <button
              type="button"
              onClick={() => setPendingRegion(null)}
              className="text-neutral-400 hover:text-white p-0.5 text-xs"
            >
              ✕
            </button>
          </div>

          {/* Reference Input */}
          <div>
            <label className="block text-neutral-300 text-[11px] font-medium mb-1">
              Número / Referência
            </label>
            <Input
              autoFocus
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
                if (e.key === "Escape") setPendingRegion(null);
              }}
              placeholder="Ex: Q01, 3.14"
              className="h-8 text-xs bg-neutral-950 border-neutral-850 text-neutral-100 font-mono"
            />
          </div>

          {/* Topic Selector */}
          {topicsList.length > 0 && (
            <div>
              <label className="block text-neutral-400 text-[10px] font-medium mb-1 flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                Vincular ao Capítulo (opcional)
              </label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-2 py-1 text-xs text-neutral-200 focus:outline-none focus:border-purple-500 h-7"
              >
                <option value="">Nenhum capítulo</option>
                {topicsList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Optional: Add as additional segment to existing exercise */}
          {exercises.length > 0 && (
            <div className="pt-1">
              <select
                value={attachToExistingId}
                onChange={(e) => setAttachToExistingId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-2 py-1 text-[11px] text-neutral-400 focus:outline-none focus:border-purple-500 h-7"
              >
                <option value="">+ Criar como nova questão</option>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    Anexar à {ex.referenceNumber || ex.title} (Trecho adicional)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-1.5 pt-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setPendingRegion(null)}
              className="h-7 text-xs text-neutral-400 hover:text-white px-2"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="h-7 text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium px-3 shadow-sm"
            >
              {isSubmitting ? "Criando..." : "Confirmar (Enter)"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
