"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  PdfNoteAnchorItem,
  AnchoredTopicNoteItem,
} from "@/services/pdf-note-anchor.service";
import {
  HelpCircle,
  Star,
  Binary,
  Flame,
  FileText,
  MapPin,
  Crop,
  X,
  Check,
  Loader2,
  LayoutGrid,
} from "lucide-react";

export type PinCreationType = "NOTE" | "IMPORTANT" | "QUESTION" | "FORMULA" | "EXAM";

interface PdfPinsLayerProps {
  pageWidth: number;
  pageHeight: number;
  pageNumber: number;
  anchoredNotes: AnchoredTopicNoteItem[];
  selectedNoteId?: string | null;
  activeTool?: string; // "PIN" | "REGION" | other
  onSelectNote: (noteId: string) => void;
  onCreateAnchoredNote: (data: {
    type: PinCreationType;
    content: string;
    anchorType: "POINT" | "REGION";
    anchorData: {
      x: number;
      y: number;
      width?: number;
      height?: number;
    };
  }) => Promise<void>;
  onAddToBoard?: (data: {
    bounding: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    pageNumber: number;
    title?: string;
    anchorId?: string | null;
  }) => void;
}

export function PdfPinsLayer({
  pageWidth,
  pageHeight,
  pageNumber,
  anchoredNotes,
  selectedNoteId,
  activeTool,
  onSelectNote,
  onCreateAnchoredNote,
  onAddToBoard,
}: PdfPinsLayerProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Region drag state
  const [isDraggingRegion, setIsDraggingRegion] = React.useState(false);
  const [regionStart, setRegionStart] = React.useState<{ x: number; y: number } | null>(null);
  const [regionCurrent, setRegionCurrent] = React.useState<{ x: number; y: number } | null>(null);

  // Creation Popover state
  const [popover, setPopover] = React.useState<{
    x: number;
    y: number;
    anchorType: "POINT" | "REGION";
    anchorData: {
      x: number;
      y: number;
      width?: number;
      height?: number;
    };
  } | null>(null);

  const [newNoteType, setNewNoteType] = React.useState<PinCreationType>("NOTE");
  const [newNoteContent, setNewNoteContent] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  // Filter notes that have anchors on this page
  const pageAnchors = React.useMemo(() => {
    return anchoredNotes
      .filter((n) => n.anchor && n.anchor.pageNumber === pageNumber)
      .map((n) => ({
        note: n,
        anchor: n.anchor!,
      }));
  }, [anchoredNotes, pageNumber]);

  // Convert screen coordinates to normalized (0..1)
  const getNormalizedPoint = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    if (activeTool === "PIN") {
      const norm = getNormalizedPoint(e);
      setPopover({
        x: norm.x,
        y: norm.y,
        anchorType: "POINT",
        anchorData: { x: norm.x, y: norm.y },
      });
      setNewNoteContent("");
    } else if (activeTool === "REGION") {
      const norm = getNormalizedPoint(e);
      setIsDraggingRegion(true);
      setRegionStart(norm);
      setRegionCurrent(norm);
      (e.target as Element).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRegion && activeTool === "REGION") {
      const norm = getNormalizedPoint(e);
      setRegionCurrent(norm);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRegion && regionStart && regionCurrent && activeTool === "REGION") {
      setIsDraggingRegion(false);
      const x = Math.min(regionStart.x, regionCurrent.x);
      const y = Math.min(regionStart.y, regionCurrent.y);
      const width = Math.abs(regionCurrent.x - regionStart.x);
      const height = Math.abs(regionCurrent.y - regionStart.y);

      if (width > 0.02 && height > 0.02) {
        setPopover({
          x: x + width / 2,
          y: y + height / 2,
          anchorType: "REGION",
          anchorData: { x, y, width, height },
        });
        setNewNoteContent("");
      }
      setRegionStart(null);
      setRegionCurrent(null);
    }
  };

  const handleSavePopover = async (e: React.FormEvent, sendToBoard = false) => {
    e.preventDefault();
    if (!popover || !newNoteContent.trim()) return;

    setIsSaving(true);
    try {
      await onCreateAnchoredNote({
        type: newNoteType,
        content: newNoteContent.trim(),
        anchorType: popover.anchorType,
        anchorData: popover.anchorData,
      });

      if (sendToBoard && popover.anchorType === "REGION" && popover.anchorData.width && popover.anchorData.height) {
        onAddToBoard?.({
          bounding: {
            x: popover.anchorData.x,
            y: popover.anchorData.y,
            width: popover.anchorData.width,
            height: popover.anchorData.height,
          },
          pageNumber,
          title: newNoteContent.slice(0, 30),
        });
      }

      setPopover(null);
      setNewNoteContent("");
    } catch {
      // Handle error
    } finally {
      setIsSaving(false);
    }
  };

  if (pageWidth === 0 || pageHeight === 0) return null;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="absolute inset-0 select-none pointer-events-auto"
      style={{
        cursor:
          activeTool === "PIN"
            ? "cell"
            : activeTool === "REGION"
            ? "crosshair"
            : "default",
      }}
    >
      {/* Existing Anchors (Pins & Regions) */}
      {pageAnchors.map(({ note, anchor }) => {
        const isSelected = selectedNoteId === note.id;

        if (anchor.anchorType === "POINT") {
          const px = anchor.data.x * pageWidth;
          const py = anchor.data.y * pageHeight;

          let pinBg = "bg-blue-600 border-blue-400 text-white";
          let symbol = "📝";

          if (note.type === "QUESTION") {
            pinBg = "bg-rose-600 border-rose-400 text-white";
            symbol = "?";
          } else if (note.type === "IMPORTANT") {
            pinBg = "bg-amber-500 border-amber-300 text-black";
            symbol = "★";
          } else if (note.type === "FORMULA") {
            pinBg = "bg-purple-600 border-purple-400 text-white";
            symbol = "ƒ";
          } else if (note.type === "EXAM") {
            pinBg = "bg-red-600 border-red-400 text-white";
            symbol = "⚠️";
          }

          return (
            <div
              key={anchor.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNote(note.id);
              }}
              style={{
                left: px,
                top: py,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer"
            >
              {/* Pin Icon Bubble */}
              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold text-xs shadow-xl transition-all duration-200 ${pinBg} ${
                  isSelected
                    ? "scale-150 ring-4 ring-purple-400 ring-offset-2 ring-offset-black animate-pulse"
                    : "hover:scale-125"
                }`}
              >
                <span>{symbol}</span>
              </div>

              {/* Hover Tooltip Preview */}
              <div className="hidden group-hover:block absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 rounded bg-neutral-950/95 border border-neutral-700 text-white text-[11px] shadow-2xl z-30 pointer-events-none animate-in fade-in zoom-in-95">
                <div className="font-semibold text-purple-300 mb-0.5 truncate">
                  {note.type === "QUESTION"
                    ? "Dúvida"
                    : note.type === "IMPORTANT"
                    ? "Importante"
                    : note.type === "FORMULA"
                    ? "Fórmula"
                    : note.type === "EXAM"
                    ? "Cai na prova"
                    : "Anotação"}
                </div>
                <p className="line-clamp-3 text-neutral-300">{note.content}</p>
              </div>
            </div>
          );
        }

        if (anchor.anchorType === "REGION" && anchor.data.width && anchor.data.height) {
          const rx = anchor.data.x * pageWidth;
          const ry = anchor.data.y * pageHeight;
          const rw = anchor.data.width * pageWidth;
          const rh = anchor.data.height * pageHeight;

          return (
            <div
              key={anchor.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNote(note.id);
              }}
              style={{
                left: rx,
                top: ry,
                width: rw,
                height: rh,
              }}
              className={`absolute border-2 rounded transition-all cursor-pointer z-15 ${
                isSelected
                  ? "border-purple-400 bg-purple-500/25 ring-4 ring-purple-500/40 shadow-xl"
                  : "border-indigo-400/70 bg-indigo-500/10 hover:border-indigo-300 hover:bg-indigo-500/20"
              }`}
            >
              {/* Region Label Tag & Quick Add To Board */}
              <div className="absolute top-1 left-1 flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-neutral-950/80 text-indigo-200 border border-indigo-700/60 shadow-sm pointer-events-none">
                  {note.type === "FORMULA"
                    ? "ƒ Fórmula"
                    : note.type === "QUESTION"
                    ? "? Dúvida"
                    : note.type === "EXAM"
                    ? "⚠️ Prova"
                    : "📐 Trecho"}
                </span>

                {onAddToBoard && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToBoard({
                        bounding: {
                          x: anchor.data.x,
                          y: anchor.data.y,
                          width: anchor.data.width!,
                          height: anchor.data.height!,
                        },
                        pageNumber,
                        anchorId: anchor.id,
                        title: note.content.slice(0, 30),
                      });
                    }}
                    className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-purple-600 hover:bg-purple-500 text-white shadow-sm flex items-center gap-0.5 transition-colors"
                    title="Adicionar este trecho à Lousa de estudo"
                  >
                    <LayoutGrid className="h-2.5 w-2.5" />
                    <span>+ Lousa</span>
                  </button>
                )}
              </div>
            </div>
          );
        }

        return null;
      })}

      {/* In-Progress Live Region Drag Rectangle */}
      {isDraggingRegion && regionStart && regionCurrent && (
        <div
          style={{
            left: Math.min(regionStart.x, regionCurrent.x) * pageWidth,
            top: Math.min(regionStart.y, regionCurrent.y) * pageHeight,
            width: Math.abs(regionCurrent.x - regionStart.x) * pageWidth,
            height: Math.abs(regionCurrent.y - regionStart.y) * pageHeight,
          }}
          className="absolute border-2 border-dashed border-purple-400 bg-purple-500/20 rounded pointer-events-none z-30"
        />
      )}

      {/* Creation Popover Modal */}
      {popover && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            left: `${Math.min(0.7, Math.max(0.1, popover.x)) * 100}%`,
            top: `${Math.min(0.7, Math.max(0.1, popover.y)) * 100}%`,
          }}
          className="absolute z-40 w-72 p-3 bg-neutral-900 border border-purple-500 rounded-xl shadow-2xl animate-in zoom-in-95"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-100 flex items-center gap-1.5">
              {popover.anchorType === "REGION" ? (
                <Crop className="h-3.5 w-3.5 text-indigo-400" />
              ) : (
                <MapPin className="h-3.5 w-3.5 text-purple-400" />
              )}
              {popover.anchorType === "REGION" ? "Novo Trecho" : "Novo Pin"}
            </span>
            <button
              type="button"
              onClick={() => setPopover(null)}
              className="text-neutral-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <form onSubmit={(e) => handleSavePopover(e, false)} className="space-y-2">
            {/* Type selector */}
            <div className="grid grid-cols-5 gap-1 text-[9px]">
              {(
                [
                  { id: "NOTE", label: "Nota" },
                  { id: "IMPORTANT", label: "★" },
                  { id: "QUESTION", label: "?" },
                  { id: "FORMULA", label: "ƒ" },
                  { id: "EXAM", label: "⚠️" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setNewNoteType(t.id as PinCreationType)}
                  className={`py-1 rounded border text-center font-bold transition-all ${
                    newNoteType === t.id
                      ? "bg-purple-600 text-white border-purple-400 ring-1 ring-white/20"
                      : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Digite o comentário ou dúvida..."
              className="w-full rounded border border-neutral-750 bg-neutral-950 p-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500 font-sans resize-none"
              autoFocus
            />

            <div className="flex items-center justify-between gap-1.5 pt-1">
              {popover.anchorType === "REGION" ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={isSaving || !newNoteContent.trim()}
                  onClick={(e) => handleSavePopover(e, true)}
                  className="h-6 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1"
                  title="Salva a nota e envia o trecho para a Lousa de estudo"
                >
                  <LayoutGrid className="h-2.5 w-2.5" />
                  + Lousa
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPopover(null)}
                  className="h-6 text-[11px] text-neutral-400"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving || !newNoteContent.trim()}
                  className="h-6 text-[11px] bg-purple-600 hover:bg-purple-500 text-white"
                >
                  {isSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Salvar"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
