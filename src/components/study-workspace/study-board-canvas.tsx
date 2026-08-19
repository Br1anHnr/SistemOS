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

  // Tool & Items
  const [activeTool, setActiveTool] = React.useState<BoardTool>("SELECT");
  const [items, setItems] = React.useState<StudyBoardItemData[]>(initialItems);
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null);

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
  }, [initialItems]);

  // Convert screen coordinates to Board Canvas Coordinates
  const getBoardCoordinates = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  };

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
    // If middle click or SELECT on empty canvas -> Pan
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
                height: Math.max(80, Math.round(resizingItem.initialH + dh)),
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
          color: "#a855f7",
          strokeWidth: 3,
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
            color: "#eab308",
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
      width: 220,
      height: 60,
      data: {
        text: "Clique para editar texto...",
        color: "#ffffff",
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
    onItemsChange?.(nextItems);

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
      className="relative w-full h-full bg-neutral-950 overflow-hidden select-none cursor-default"
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

          if (item.type === "TEXT") {
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
                className={`absolute p-2 rounded-lg border transition-all ${
                  isSelected
                    ? "border-purple-500 ring-2 ring-purple-500/50 bg-neutral-900/90"
                    : "border-transparent hover:border-neutral-800 bg-neutral-900/60"
                }`}
              >
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
                    className="cursor-move p-0.5 text-neutral-500 hover:text-white"
                    title="Mover texto"
                  >
                    <Move className="h-3 w-3" />
                  </div>
                  {isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id);
                      }}
                      className="text-neutral-500 hover:text-red-400 p-0.5"
                      title="Excluir"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  defaultValue={item.data.text}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }
                  }}
                  onBlur={(e) =>
                    persistItemUpdate(item.id, {
                      data: { ...item.data, text: e.target.value },
                    })
                  }
                  className="w-full bg-transparent font-medium text-sm text-neutral-100 focus:outline-none focus:border-b border-purple-500 font-sans"
                />
              </div>
            );
          }

          if (item.type === "NOTE") {
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
                className={`absolute flex flex-col rounded-xl border p-3 bg-neutral-900/90 backdrop-blur-md shadow-2xl transition-all ${
                  isSelected
                    ? "border-purple-500 ring-2 ring-purple-500/50"
                    : "border-neutral-800 hover:border-neutral-750"
                }`}
              >
                {/* Note Header */}
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800 shrink-0">
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
                    className="cursor-move flex items-center gap-1.5 text-neutral-400 hover:text-white"
                  >
                    <Move className="h-3 w-3" />
                    <input
                      type="text"
                      defaultValue={item.data.title || "Nota"}
                      onBlur={(e) =>
                        persistItemUpdate(item.id, {
                          data: { ...item.data, title: e.target.value },
                        })
                      }
                      className="bg-transparent text-xs font-bold text-neutral-200 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBringToFront(item.id);
                      }}
                      className="p-1 text-neutral-500 hover:text-white"
                      title="Trazer para frente"
                    >
                      <ArrowUp className="h-2.5 w-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendToBack(item.id);
                      }}
                      className="p-1 text-neutral-500 hover:text-white"
                      title="Enviar para trás"
                    >
                      <ArrowDown className="h-2.5 w-2.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id);
                      }}
                      className="p-1 text-neutral-500 hover:text-red-400"
                      title="Excluir nota"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Note Content */}
                <div className="flex-1 pt-2">
                  <textarea
                    defaultValue={item.data.content}
                    onBlur={(e) =>
                      persistItemUpdate(item.id, {
                        data: { ...item.data, content: e.target.value },
                      })
                    }
                    placeholder="Escreva sua explicação..."
                    className="w-full h-full bg-transparent text-xs text-neutral-300 placeholder:text-neutral-600 focus:outline-none resize-none font-sans"
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
                  className="absolute bottom-1 right-1 w-3 h-3 cursor-se-resize text-neutral-600 hover:text-white flex items-center justify-center font-mono text-xs"
                >
                  ⌟
                </div>
              </div>
            );
          }

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
              <polygon points="0 0, 8 4, 0 8" fill="#eab308" />
            </marker>
          </defs>

          {items.map((item) => {
            if (item.type === "DRAWING" && item.data.points) {
              const points = item.data.points;
              let d = `M ${points[0].x} ${points[0].y}`;
              for (let i = 1; i < points.length; i++) {
                d += ` L ${points[i].x} ${points[i].y}`;
              }
              return (
                <path
                  key={item.id}
                  d={d}
                  stroke={item.data.color || "#a855f7"}
                  strokeWidth={item.data.strokeWidth || 3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              );
            }

            if (item.type === "ARROW" && item.data.startX !== undefined) {
              return (
                <line
                  key={item.id}
                  x1={item.data.startX}
                  y1={item.data.startY}
                  x2={item.data.endX}
                  y2={item.data.endY}
                  stroke={item.data.color || "#eab308"}
                  strokeWidth={3}
                  strokeLinecap="round"
                  markerEnd="url(#board-arrow)"
                />
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
              stroke="#a855f7"
              strokeWidth={3}
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
              stroke="#eab308"
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray="4 4"
            />
          )}
        </svg>
      </div>
    </div>
  );
}
