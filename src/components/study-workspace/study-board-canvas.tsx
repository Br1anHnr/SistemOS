"use client";

import * as React from "react";
import { BoardTool, StudyBoardToolbar } from "./study-board-toolbar";
import { PdfRegionCard } from "./board-elements/pdf-region-card";
import { StudyBoardItemData } from "@/services/study-board.service";
import {
  createStudyBoardItemAction,
  updateStudyBoardItemAction,
  deleteStudyBoardItemAction,
} from "@/actions/study-board.actions";
import {
  Move,
  Trash2,
  ArrowUp,
  ArrowDown,
  Edit2,
  FileText,
  Type,
  Palette,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface StudyBoardCanvasProps {
  boardId: string;
  topicId: string;
  subjectId?: string;
  pdfUrl?: string | null;
  initialItems?: StudyBoardItemData[];
  onItemsChange?: (items: StudyBoardItemData[]) => void;
  onOpenInPdf: (pageNumber: number, anchorId?: string | null) => void;
}

const NOTE_THEMES: Record<string, { bg: string; border: string; text: string }> = {
  neutral: {
    bg: "bg-neutral-900/90",
    border: "border-neutral-800",
    text: "text-neutral-200",
  },
  purple: {
    bg: "bg-purple-950/70",
    border: "border-purple-800/80",
    text: "text-purple-200",
  },
  blue: {
    bg: "bg-blue-950/70",
    border: "border-blue-800/80",
    text: "text-blue-200",
  },
  yellow: {
    bg: "bg-amber-950/70",
    border: "border-amber-800/80",
    text: "text-amber-200",
  },
  green: {
    bg: "bg-emerald-950/70",
    border: "border-emerald-800/80",
    text: "text-emerald-200",
  },
  red: {
    bg: "bg-red-950/70",
    border: "border-red-800/80",
    text: "text-red-200",
  },
};

export function StudyBoardCanvas({
  boardId,
  topicId,
  subjectId,
  pdfUrl,
  initialItems = [],
  onItemsChange,
  onOpenInPdf,
}: StudyBoardCanvasProps) {
  const { toast } = useToast();
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Pan & Zoom
  const [zoom, setZoom] = React.useState<number>(1.0);
  const [pan, setPan] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Tool & Styling
  const [activeTool, setActiveTool] = React.useState<BoardTool>("SELECT");
  const [color, setColor] = React.useState<string>("#a855f7");
  const [strokeWidth, setStrokeWidth] = React.useState<number>(4);

  // Items and Selection
  const [items, setItems] = React.useState<StudyBoardItemData[]>(initialItems);
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null);

  // History for Undo / Redo
  const [history, setHistory] = React.useState<StudyBoardItemData[][]>([initialItems]);
  const [historyIndex, setHistoryIndex] = React.useState<number>(0);

  // Live Drawing / Arrow state
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [currentStroke, setCurrentStroke] = React.useState<{ x: number; y: number }[]>([]);
  const [arrowStart, setArrowStart] = React.useState<{ x: number; y: number } | null>(null);
  const [arrowCurrent, setArrowCurrent] = React.useState<{ x: number; y: number } | null>(null);

  // Dragging / Resizing Item state
  const [draggingItem, setDraggingItem] = React.useState<{
    id: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  const [resizingItem, setResizingItem] = React.useState<{
    id: string;
    startX: number;
    startY: number;
    initialW: number;
    initialH: number;
  } | null>(null);

  // Auto-save indicators
  const [isSaving, setIsSaving] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);

  // Sync initial items when changed externally
  React.useEffect(() => {
    setItems(initialItems);
    setHistory([initialItems]);
    setHistoryIndex(0);
  }, [initialItems]);

  // Push to history helper
  const pushHistory = (newItems: StudyBoardItemData[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newItems);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  // Convert screen coordinates to Board Canvas Coordinates
  const getBoardCoordinates = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  // Helper to check if active element is a text input
  const isTyping = (target: EventTarget | null) => {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tag = target.tagName.toLowerCase();
    return (
      tag === "input" ||
      tag === "textarea" ||
      target.isContentEditable ||
      target.getAttribute("role") === "textbox"
    );
  };

  // Keyboard Shortcuts in Lousa
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTyping(document.activeElement)) return;

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isUndo = (isMac ? e.metaKey : e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "z";
      const isRedo =
        ((isMac ? e.metaKey : e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "z") ||
        ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "y");

      if (isUndo) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (isRedo) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedItemId) {
          e.preventDefault();
          handleDeleteItem(selectedItemId);
        }
        return;
      }

      switch (e.key.toUpperCase()) {
        case "V":
          setActiveTool("SELECT");
          break;
        case "T":
          setActiveTool("TEXT");
          break;
        case "N":
          setActiveTool("NOTE");
          break;
        case "P":
          setActiveTool("PEN");
          break;
        case "A":
          setActiveTool("ARROW");
          break;
        case "E":
          setActiveTool("ERASER");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItemId, historyIndex, history, items]);

  // --- PANNING HANDLERS ---
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom((z) => Math.max(0.25, Math.min(2.0, z * zoomFactor)));
    } else {
      setPan((p) => ({
        x: p.x - e.deltaX,
        y: p.y - e.deltaY,
      }));
    }
  };

  const handlePointerDownBackground = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const isBackground =
      target.id === "board-bg" ||
      target.tagName === "svg" ||
      target === containerRef.current;

    if (e.button === 1 || (activeTool === "SELECT" && isBackground)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      setSelectedItemId(null);
      containerRef.current?.setPointerCapture(e.pointerId);
      return;
    }

    const { x, y } = getBoardCoordinates(e.clientX, e.clientY);

    if (activeTool === "TEXT") {
      handleCreateTextItem(x, y);
      setActiveTool("SELECT");
    } else if (activeTool === "NOTE") {
      handleCreateNoteItem(x, y);
      setActiveTool("SELECT");
    } else if (activeTool === "PEN") {
      setIsDrawing(true);
      setCurrentStroke([{ x, y }]);
      containerRef.current?.setPointerCapture(e.pointerId);
    } else if (activeTool === "ARROW") {
      setIsDrawing(true);
      setArrowStart({ x, y });
      setArrowCurrent({ x, y });
      containerRef.current?.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const { x, y } = getBoardCoordinates(e.clientX, e.clientY);

    if (isDrawing && activeTool === "PEN") {
      setCurrentStroke((prev) => [...prev, { x, y }]);
    } else if (isDrawing && activeTool === "ARROW") {
      setArrowCurrent({ x, y });
    } else if (draggingItem) {
      const dx = (e.clientX - draggingItem.startX) / zoom;
      const dy = (e.clientY - draggingItem.startY) / zoom;

      setItems((prev) =>
        prev.map((item) =>
          item.id === draggingItem.id
            ? { ...item, x: Math.round(draggingItem.initialX + dx), y: Math.round(draggingItem.initialY + dy) }
            : item
        )
      );
    } else if (resizingItem) {
      const dw = (e.clientX - resizingItem.startX) / zoom;
      const dh = (e.clientY - resizingItem.startY) / zoom;

      setItems((prev) =>
        prev.map((item) =>
          item.id === resizingItem.id
            ? {
                ...item,
                width: Math.max(120, Math.round(resizingItem.initialW + dw)),
                height: Math.max(60, Math.round(resizingItem.initialH + dh)),
              }
            : item
        )
      );
    }
  };

  const handlePointerUp = async (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && activeTool === "PEN" && currentStroke.length > 1) {
      setIsDrawing(false);
      const minX = Math.min(...currentStroke.map((p) => p.x));
      const minY = Math.min(...currentStroke.map((p) => p.y));
      const maxX = Math.max(...currentStroke.map((p) => p.x));
      const maxY = Math.max(...currentStroke.map((p) => p.y));

      await handleCreateItem({
        type: "DRAWING",
        x: minX,
        y: minY,
        width: Math.max(20, maxX - minX),
        height: Math.max(20, maxY - minY),
        data: {
          points: currentStroke,
          color,
          strokeWidth,
        },
      });
      setCurrentStroke([]);
    } else if (isDrawing && activeTool === "ARROW" && arrowStart && arrowCurrent) {
      setIsDrawing(false);
      const distance = Math.hypot(arrowCurrent.x - arrowStart.x, arrowCurrent.y - arrowStart.y);
      if (distance > 15) {
        await handleCreateItem({
          type: "ARROW",
          x: Math.min(arrowStart.x, arrowCurrent.x),
          y: Math.min(arrowStart.y, arrowCurrent.y),
          width: Math.abs(arrowCurrent.x - arrowStart.x),
          height: Math.abs(arrowCurrent.y - arrowStart.y),
          data: {
            startX: arrowStart.x,
            startY: arrowStart.y,
            endX: arrowCurrent.x,
            endY: arrowCurrent.y,
            color,
            strokeWidth,
          },
        });
      }
      setArrowStart(null);
      setArrowCurrent(null);
    }

    if (draggingItem) {
      const moved = items.find((i) => i.id === draggingItem.id);
      setDraggingItem(null);
      if (moved) {
        persistItemUpdate(moved.id, { x: moved.x, y: moved.y });
      }
    }

    if (resizingItem) {
      const resized = items.find((i) => i.id === resizingItem.id);
      setResizingItem(null);
      if (resized) {
        persistItemUpdate(resized.id, { width: resized.width, height: resized.height });
      }
    }
  };

  // --- CRUD ACTIONS ---
  const handleCreateItem = async (data: {
    type: "TEXT" | "NOTE" | "DRAWING" | "ARROW" | "PDF_REGION";
    x: number;
    y: number;
    width: number;
    height: number;
    data: Record<string, any>;
  }) => {
    setIsSaving(true);
    try {
      const res = await createStudyBoardItemAction(
        {
          boardId,
          type: data.type,
          x: data.x,
          y: data.y,
          width: data.width,
          height: data.height,
          zIndex: items.length + 1,
          data: data.data,
        },
        subjectId
      );

      if (res.success && res.data) {
        const nextItems = [...items, res.data as StudyBoardItemData];
        setItems(nextItems);
        pushHistory(nextItems);
        onItemsChange?.(nextItems);
        setLastSavedAt(new Date());
      } else {
        toast(res.error || "Erro ao salvar elemento na lousa.", "error");
      }
    } catch {
      toast("Erro ao criar item na lousa.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateTextItem = (x: number, y: number) => {
    handleCreateItem({
      type: "TEXT",
      x,
      y,
      width: 240,
      height: 48,
      data: {
        text: "Escreva algo livremente...",
        color: color || "#ffffff",
        fontSize: 16,
      },
    });
  };

  const handleCreateNoteItem = (x: number, y: number) => {
    handleCreateItem({
      type: "NOTE",
      x,
      y,
      width: 260,
      height: 180,
      data: {
        title: "Ideia Principal",
        content: "Anotação de raciocínio da aula...",
        color: "purple",
      },
    });
  };

  const persistItemUpdate = async (
    id: string,
    updates: Partial<{
      x: number;
      y: number;
      width: number;
      height: number;
      zIndex: number;
      data: Record<string, any>;
    }>
  ) => {
    setIsSaving(true);
    try {
      const res = await updateStudyBoardItemAction(id, updates, subjectId);
      if (res.success && res.data) {
        setItems((prev) => {
          const next = prev.map((item) => (item.id === id ? (res.data as StudyBoardItemData) : item));
          onItemsChange?.(next);
          return next;
        });
        setLastSavedAt(new Date());
      } else {
        toast(res.error || "Erro ao atualizar item na lousa.", "error");
      }
    } catch {
      // Silently fail on autosave
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const nextItems = items.filter((i) => i.id !== id);
    setItems(nextItems);
    pushHistory(nextItems);
    onItemsChange?.(nextItems);
    if (selectedItemId === id) setSelectedItemId(null);

    setIsSaving(true);
    try {
      await deleteStudyBoardItemAction(id, subjectId);
      setLastSavedAt(new Date());
      toast("Item removido da lousa.");
    } catch {
      toast("Erro ao remover item.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevItems = history[historyIndex - 1];
      setItems(prevItems);
      setHistoryIndex(historyIndex - 1);
      onItemsChange?.(prevItems);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextItems = history[historyIndex + 1];
      setItems(nextItems);
      setHistoryIndex(historyIndex + 1);
      onItemsChange?.(nextItems);
    }
  };

  const handleBringToFront = (id: string) => {
    const maxZ = Math.max(...items.map((i) => i.zIndex), 0);
    const newZ = maxZ + 1;
    setItems((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, zIndex: newZ } : item));
      onItemsChange?.(next);
      return next;
    });
    persistItemUpdate(id, { zIndex: newZ });
  };

  const handleSendToBack = (id: string) => {
    const minZ = Math.min(...items.map((i) => i.zIndex), 0);
    const newZ = Math.max(0, minZ - 1);
    setItems((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, zIndex: newZ } : item));
      onItemsChange?.(next);
      return next;
    });
    persistItemUpdate(id, { zIndex: newZ });
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDownBackground}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`relative w-full h-full bg-neutral-950 overflow-hidden select-none ${
        activeTool === "ERASER"
          ? "cursor-pointer"
          : activeTool === "PEN" || activeTool === "ARROW"
          ? "cursor-crosshair"
          : activeTool === "TEXT"
          ? "cursor-text"
          : "cursor-default"
      }`}
      style={{
        backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
    >
      {/* Floating Toolbar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
        <StudyBoardToolbar
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          color={color}
          onChangeColor={setColor}
          strokeWidth={strokeWidth}
          onChangeStrokeWidth={setStrokeWidth}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
          zoom={zoom}
          onZoomIn={() => setZoom((z) => Math.min(2.0, z + 0.15))}
          onZoomOut={() => setZoom((z) => Math.max(0.25, z - 0.15))}
          onResetView={() => {
            setZoom(1.0);
            setPan({ x: 0, y: 0 });
          }}
          isSaving={isSaving}
          lastSavedAt={lastSavedAt}
        />
      </div>

      {/* Infinite Canvas Transform Viewport */}
      <div
        id="board-bg"
        className="w-full h-full absolute inset-0 origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* Render Items */}
        {items.map((item) => {
          const isSelected = selectedItemId === item.id;

          // 1. FREE TEXT ELEMENT (No background, no grey card, pure freeform text)
          if (item.type === "TEXT") {
            const textColor = item.data.color || "#ffffff";

            return (
              <div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItemId(item.id);
                }}
                style={{
                  left: item.x,
                  top: item.y,
                  width: item.width,
                  zIndex: item.zIndex,
                }}
                className={`absolute transition-all ${
                  isSelected
                    ? "border border-dashed border-purple-500/80 bg-neutral-900/20 rounded p-1.5 ring-2 ring-purple-500/30"
                    : "border border-transparent p-1.5 hover:border-neutral-800/60"
                }`}
              >
                {/* Minimal Header on hover or select */}
                {isSelected && (
                  <div className="flex items-center justify-between gap-1 pb-1">
                    <div
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        (e.target as Element).setPointerCapture(e.pointerId);
                        setDraggingItem({
                          id: item.id,
                          startX: e.clientX,
                          startY: e.clientY,
                          initialX: item.x,
                          initialY: item.y,
                        });
                      }}
                      className="cursor-move p-0.5 text-neutral-400 hover:text-white"
                      title="Mover texto livre"
                    >
                      <Move className="h-3 w-3" />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id);
                      }}
                      className="text-neutral-500 hover:text-red-400 p-0.5"
                      title="Excluir texto"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}

                <textarea
                  defaultValue={item.data.text}
                  rows={2}
                  onBlur={(e) =>
                    persistItemUpdate(item.id, {
                      data: { ...item.data, text: e.target.value },
                    })
                  }
                  style={{ color: textColor }}
                  className="w-full bg-transparent font-sans text-base leading-snug font-medium focus:outline-none resize-none border-none outline-none"
                />
              </div>
            );
          }

          // 2. STUDY NOTE CARD (Rich card with background color themes)
          if (item.type === "NOTE") {
            const noteColor = item.data.color || "purple";
            const theme = NOTE_THEMES[noteColor] || NOTE_THEMES.neutral;

            return (
              <div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItemId(item.id);
                }}
                style={{
                  left: item.x,
                  top: item.y,
                  width: item.width,
                  height: item.height,
                  zIndex: item.zIndex,
                }}
                className={`absolute flex flex-col rounded-xl border p-3.5 backdrop-blur-md shadow-2xl transition-all ${
                  theme.bg
                } ${theme.border} ${
                  isSelected ? "ring-2 ring-purple-400/80 shadow-purple-950/50" : "hover:border-neutral-700"
                }`}
              >
                {/* Note Header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0 gap-2">
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      (e.target as Element).setPointerCapture(e.pointerId);
                      setDraggingItem({
                        id: item.id,
                        startX: e.clientX,
                        startY: e.clientY,
                        initialX: item.x,
                        initialY: item.y,
                      });
                    }}
                    className="cursor-move flex items-center gap-1.5 text-neutral-300 hover:text-white min-w-0"
                  >
                    <Move className="h-3 w-3 shrink-0" />
                    <input
                      type="text"
                      defaultValue={item.data.title || "Nota"}
                      onBlur={(e) =>
                        persistItemUpdate(item.id, {
                          data: { ...item.data, title: e.target.value },
                        })
                      }
                      className="bg-transparent text-xs font-bold text-neutral-100 focus:outline-none truncate"
                    />
                  </div>

                  {/* Color Selector Dots */}
                  <div className="flex items-center gap-1 shrink-0">
                    {["neutral", "purple", "blue", "yellow", "green", "red"].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          persistItemUpdate(item.id, {
                            data: { ...item.data, color: c },
                          });
                        }}
                        className={`w-2.5 h-2.5 rounded-full transition-transform ${
                          noteColor === c ? "scale-125 ring-1 ring-white" : "opacity-60 hover:opacity-100"
                        } ${
                          c === "neutral"
                            ? "bg-neutral-600"
                            : c === "purple"
                            ? "bg-purple-500"
                            : c === "blue"
                            ? "bg-blue-500"
                            : c === "yellow"
                            ? "bg-amber-500"
                            : c === "green"
                            ? "bg-emerald-500"
                            : "bg-red-500"
                        }`}
                      />
                    ))}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id);
                      }}
                      className="p-0.5 text-neutral-400 hover:text-red-400 ml-1"
                      title="Excluir card de nota"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Note Content Textarea */}
                <div className="flex-1 pt-2">
                  <textarea
                    defaultValue={item.data.content}
                    onBlur={(e) =>
                      persistItemUpdate(item.id, {
                        data: { ...item.data, content: e.target.value },
                      })
                    }
                    placeholder="Escreva suas anotações..."
                    className="w-full h-full bg-transparent text-xs text-neutral-200 placeholder:text-neutral-500 focus:outline-none resize-none font-sans"
                  />
                </div>

                {/* Resize Handle */}
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    (e.target as Element).setPointerCapture(e.pointerId);
                    setResizingItem({
                      id: item.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      initialW: item.width,
                      initialH: item.height,
                    });
                  }}
                  className="absolute bottom-1 right-1 w-3 h-3 cursor-se-resize text-neutral-500 hover:text-white flex items-center justify-center font-mono text-xs"
                >
                  ⌟
                </div>
              </div>
            );
          }

          // 3. PDF REGION CARD ELEMENT
          if (item.type === "PDF_REGION") {
            return (
              <div
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItemId(item.id);
                }}
                style={{
                  left: item.x,
                  top: item.y,
                  width: item.width,
                  height: item.height,
                  zIndex: item.zIndex,
                }}
                className={`absolute rounded-xl transition-all ${
                  isSelected ? "ring-2 ring-indigo-500 shadow-2xl" : ""
                }`}
              >
                {/* Drag Handle Bar */}
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    (e.target as Element).setPointerCapture(e.pointerId);
                    setDraggingItem({
                      id: item.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      initialX: item.x,
                      initialY: item.y,
                    });
                  }}
                  className="absolute -top-3 left-2 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-[10px] text-neutral-300 cursor-move flex items-center gap-1 z-30 shadow-md"
                >
                  <Move className="h-2.5 w-2.5" />
                  <span>Mover Trecho</span>
                </div>

                <PdfRegionCard
                  id={item.id}
                  data={item.data as any}
                  pdfUrl={pdfUrl}
                  width={item.width}
                  height={item.height}
                  onOpenInPdf={onOpenInPdf}
                  onDelete={() => handleDeleteItem(item.id)}
                />

                {/* Resize Handle */}
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    (e.target as Element).setPointerCapture(e.pointerId);
                    setResizingItem({
                      id: item.id,
                      startX: e.clientX,
                      startY: e.clientY,
                      initialW: item.width,
                      initialH: item.height,
                    });
                  }}
                  className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize text-neutral-400 hover:text-white flex items-center justify-center z-30 font-mono text-xs"
                >
                  ⌟
                </div>
              </div>
            );
          }

          return null;
        })}

        {/* Global SVG Overlay for DRAWING and ARROW items */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker
              id="board-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <polygon points="0 0, 8 4, 0 8" fill={color || "#eab308"} />
            </marker>
          </defs>

          {items.map((item) => {
            if (item.type === "DRAWING" && item.data.points) {
              const points = item.data.points;
              let d = `M ${points[0].x} ${points[0].y}`;
              for (let i = 1; i < points.length; i++) {
                d += ` L ${points[i].x} ${points[i].y}`;
              }

              const isSelected = selectedItemId === item.id;

              return (
                <path
                  key={item.id}
                  d={d}
                  stroke={item.data.color || "#a855f7"}
                  strokeWidth={item.data.strokeWidth || 4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  className="cursor-pointer pointer-events-auto transition-opacity hover:opacity-80"
                  style={isSelected ? { filter: "drop-shadow(0 0 6px rgba(168,85,247,0.8))" } : undefined}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (activeTool === "ERASER") {
                      handleDeleteItem(item.id);
                    } else {
                      setSelectedItemId(item.id);
                    }
                  }}
                  onPointerEnter={(e) => {
                    if (e.buttons === 1 && activeTool === "ERASER") {
                      handleDeleteItem(item.id);
                    }
                  }}
                />
              );
            }

            if (item.type === "ARROW" && item.data.startX !== undefined) {
              const isSelected = selectedItemId === item.id;

              return (
                <g
                  key={item.id}
                  className="cursor-pointer pointer-events-auto hover:opacity-80"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    if (activeTool === "ERASER") {
                      handleDeleteItem(item.id);
                    } else {
                      setSelectedItemId(item.id);
                    }
                  }}
                  onPointerEnter={(e) => {
                    if (e.buttons === 1 && activeTool === "ERASER") {
                      handleDeleteItem(item.id);
                    }
                  }}
                >
                  <line
                    x1={item.data.startX}
                    y1={item.data.startY}
                    x2={item.data.endX}
                    y2={item.data.endY}
                    stroke={item.data.color || "#eab308"}
                    strokeWidth={item.data.strokeWidth || 3}
                    strokeLinecap="round"
                    markerEnd="url(#board-arrow)"
                    style={isSelected ? { filter: "drop-shadow(0 0 6px rgba(234,179,8,0.8))" } : undefined}
                  />
                  <circle
                    cx={item.data.startX}
                    cy={item.data.startY}
                    r={(item.data.strokeWidth || 3) * 1.2}
                    fill={item.data.color || "#eab308"}
                  />
                </g>
              );
            }

            return null;
          })}

          {/* In-Progress Live Stroke */}
          {isDrawing && activeTool === "PEN" && currentStroke.length > 1 && (
            <path
              d={`M ${currentStroke[0].x} ${currentStroke[0].y} ${currentStroke
                .slice(1)
                .map((p) => `L ${p.x} ${p.y}`)
                .join(" ")}`}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}

          {/* In-Progress Live Arrow */}
          {isDrawing && activeTool === "ARROW" && arrowStart && arrowCurrent && (
            <line
              x1={arrowStart.x}
              y1={arrowStart.y}
              x2={arrowCurrent.x}
              y2={arrowCurrent.y}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray="4 4"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
