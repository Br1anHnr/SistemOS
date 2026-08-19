"use client";

import * as React from "react";
import { AnnotationTool } from "./annotation-toolbar";
import { Trash2 } from "lucide-react";

export interface NormalizedPoint {
  x: number;
  y: number;
}

export interface AnnotationData {
  id: string;
  type: "PEN" | "HIGHLIGHT" | "ARROW" | "TEXT" | "RECTANGLE";
  pageNumber: number;
  data: {
    points?: NormalizedPoint[];
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    text?: string;
    color?: string;
    strokeWidth?: number;
    opacity?: number;
    fontSize?: number;
    fillColor?: string;
  };
}

interface AnnotationLayerProps {
  pageWidth: number;
  pageHeight: number;
  activeTool: AnnotationTool;
  color: string;
  strokeWidth: number;
  annotations: AnnotationData[];
  isVisible: boolean;
  onAddAnnotation: (ann: Omit<AnnotationData, "id">) => void;
  onUpdateAnnotation: (id: string, data: Partial<AnnotationData["data"]>) => void;
  onDeleteAnnotation: (id: string) => void;
}

export function AnnotationLayer({
  pageWidth,
  pageHeight,
  activeTool,
  color,
  strokeWidth,
  annotations,
  isVisible,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
}: AnnotationLayerProps) {
  const containerRef = React.useRef<SVGSVGElement | null>(null);

  // Active drawing state
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [currentPoints, setCurrentPoints] = React.useState<NormalizedPoint[]>([]);
  const [dragStart, setDragStart] = React.useState<NormalizedPoint | null>(null);
  const [dragCurrent, setDragCurrent] = React.useState<NormalizedPoint | null>(null);

  // Text input state
  const [textPrompt, setTextPrompt] = React.useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);

  // Selection state
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  if (!isVisible || pageWidth === 0 || pageHeight === 0) return null;

  // Helper to convert screen pointer to normalized coordinates (0..1)
  const getNormalizedCoordinates = (e: React.PointerEvent<SVGSVGElement>): NormalizedPoint => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only main button
    const norm = getNormalizedCoordinates(e);

    if (activeTool === "PEN" || activeTool === "HIGHLIGHT") {
      setIsDrawing(true);
      setCurrentPoints([norm]);
      (e.target as Element).setPointerCapture(e.pointerId);
    } else if (activeTool === "ARROW" || activeTool === "RECTANGLE") {
      setIsDrawing(true);
      setDragStart(norm);
      setDragCurrent(norm);
      (e.target as Element).setPointerCapture(e.pointerId);
    } else if (activeTool === "TEXT") {
      setTextPrompt({ x: norm.x, y: norm.y, text: "" });
    } else if (activeTool === "SELECT") {
      // If clicked on empty space, deselect
      if ((e.target as Element).tagName === "svg") {
        setSelectedId(null);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    const norm = getNormalizedCoordinates(e);

    if (activeTool === "PEN" || activeTool === "HIGHLIGHT") {
      setCurrentPoints((prev) => [...prev, norm]);
    } else if (activeTool === "ARROW" || activeTool === "RECTANGLE") {
      setDragCurrent(norm);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const norm = getNormalizedCoordinates(e);

    if (activeTool === "PEN" && currentPoints.length > 1) {
      onAddAnnotation({
        type: "PEN",
        pageNumber: 1,
        data: {
          points: currentPoints,
          color,
          strokeWidth,
          opacity: 1,
        },
      });
    } else if (activeTool === "HIGHLIGHT" && currentPoints.length > 1) {
      onAddAnnotation({
        type: "HIGHLIGHT",
        pageNumber: 1,
        data: {
          points: currentPoints,
          color,
          strokeWidth: strokeWidth * 4,
          opacity: 0.35,
        },
      });
    } else if (activeTool === "ARROW" && dragStart) {
      const distance = Math.hypot(norm.x - dragStart.x, norm.y - dragStart.y);
      if (distance > 0.01) {
        onAddAnnotation({
          type: "ARROW",
          pageNumber: 1,
          data: {
            startX: dragStart.x,
            startY: dragStart.y,
            endX: norm.x,
            endY: norm.y,
            color,
            strokeWidth,
          },
        });
      }
    } else if (activeTool === "RECTANGLE" && dragStart) {
      const x = Math.min(dragStart.x, norm.x);
      const y = Math.min(dragStart.y, norm.y);
      const width = Math.abs(norm.x - dragStart.x);
      const height = Math.abs(norm.y - dragStart.y);

      if (width > 0.01 && height > 0.01) {
        onAddAnnotation({
          type: "RECTANGLE",
          pageNumber: 1,
          data: {
            x,
            y,
            width,
            height,
            color,
            strokeWidth,
            fillColor: `${color}20`,
          },
        });
      }
    }

    setCurrentPoints([]);
    setDragStart(null);
    setDragCurrent(null);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textPrompt && textPrompt.text.trim()) {
      onAddAnnotation({
        type: "TEXT",
        pageNumber: 1,
        data: {
          x: textPrompt.x,
          y: textPrompt.y,
          text: textPrompt.text.trim(),
          color,
          fontSize: 14,
        },
      });
    }
    setTextPrompt(null);
  };

  // Helper to build SVG path data string from normalized points
  const buildSvgPath = (points: NormalizedPoint[]): string => {
    if (points.length === 0) return "";
    let d = `M ${points[0].x * pageWidth} ${points[0].y * pageHeight}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x * pageWidth} ${points[i].y * pageHeight}`;
    }
    return d;
  };

  const isInteractive = activeTool !== "SELECT";

  return (
    <div
      className="absolute inset-0 select-none overflow-hidden"
      style={{
        pointerEvents: activeTool === "SELECT" ? "auto" : "auto",
        cursor:
          activeTool === "PEN"
            ? "crosshair"
            : activeTool === "HIGHLIGHT"
            ? "cell"
            : activeTool === "ARROW" || activeTool === "RECTANGLE"
            ? "crosshair"
            : activeTool === "TEXT"
            ? "text"
            : activeTool === "ERASER"
            ? "pointer"
            : "default",
      }}
    >
      <svg
        ref={containerRef}
        className="w-full h-full absolute inset-0"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          setIsDrawing(false);
          setCurrentPoints([]);
        }}
      >
        <defs>
          {/* Arrow Head Marker */}
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="4"
            orient="auto"
          >
            <polygon points="0 0, 8 4, 0 8" fill={color} />
          </marker>
        </defs>

        {/* Existing Annotations */}
        {annotations.map((ann) => {
          const isSelected = selectedId === ann.id;

          if (ann.type === "PEN" && ann.data.points) {
            return (
              <path
                key={ann.id}
                d={buildSvgPath(ann.data.points)}
                stroke={ann.data.color || "#eab308"}
                strokeWidth={ann.data.strokeWidth || 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={ann.data.opacity ?? 1}
                className="transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTool === "ERASER") onDeleteAnnotation(ann.id);
                  if (activeTool === "SELECT") setSelectedId(ann.id);
                }}
              />
            );
          }

          if (ann.type === "HIGHLIGHT" && ann.data.points) {
            return (
              <path
                key={ann.id}
                d={buildSvgPath(ann.data.points)}
                stroke={ann.data.color || "#eab308"}
                strokeWidth={ann.data.strokeWidth || 16}
                strokeLinecap="square"
                strokeLinejoin="round"
                fill="none"
                opacity={ann.data.opacity ?? 0.35}
                style={{ mixBlendMode: "multiply" }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTool === "ERASER") onDeleteAnnotation(ann.id);
                  if (activeTool === "SELECT") setSelectedId(ann.id);
                }}
              />
            );
          }

          if (ann.type === "ARROW" && ann.data.startX !== undefined && ann.data.endX !== undefined) {
            const x1 = ann.data.startX * pageWidth;
            const y1 = ann.data.startY! * pageHeight;
            const x2 = ann.data.endX * pageWidth;
            const y2 = ann.data.endY! * pageHeight;

            return (
              <g
                key={ann.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTool === "ERASER") onDeleteAnnotation(ann.id);
                  if (activeTool === "SELECT") setSelectedId(ann.id);
                }}
              >
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={ann.data.color || "#ef4444"}
                  strokeWidth={ann.data.strokeWidth || 3}
                  strokeLinecap="round"
                />
                {/* Arrowhead polygon calculated manually for dynamic colors */}
                <circle
                  cx={x2}
                  cy={y2}
                  r={(ann.data.strokeWidth || 3) * 1.5}
                  fill={ann.data.color || "#ef4444"}
                />
              </g>
            );
          }

          if (ann.type === "RECTANGLE" && ann.data.x !== undefined) {
            const x = ann.data.x * pageWidth;
            const y = ann.data.y! * pageHeight;
            const w = ann.data.width! * pageWidth;
            const h = ann.data.height! * pageHeight;

            return (
              <rect
                key={ann.id}
                x={x}
                y={y}
                width={w}
                height={h}
                stroke={ann.data.color || "#3b82f6"}
                strokeWidth={ann.data.strokeWidth || 2}
                fill={ann.data.fillColor || "rgba(59, 130, 246, 0.15)"}
                rx={4}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTool === "ERASER") onDeleteAnnotation(ann.id);
                  if (activeTool === "SELECT") setSelectedId(ann.id);
                }}
              />
            );
          }

          if (ann.type === "TEXT" && ann.data.x !== undefined) {
            const x = ann.data.x * pageWidth;
            const y = ann.data.y! * pageHeight;

            return (
              <g
                key={ann.id}
                transform={`translate(${x}, ${y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTool === "ERASER") onDeleteAnnotation(ann.id);
                  if (activeTool === "SELECT") setSelectedId(ann.id);
                }}
              >
                <rect
                  x={-4}
                  y={-14}
                  width={(ann.data.text?.length || 5) * 8.5 + 8}
                  height={22}
                  fill="rgba(0, 0, 0, 0.75)"
                  stroke={isSelected ? "#a855f7" : "rgba(255,255,255,0.2)"}
                  strokeWidth={1}
                  rx={4}
                />
                <text
                  x={0}
                  y={0}
                  fill={ann.data.color || "#ffffff"}
                  fontSize={ann.data.fontSize || 13}
                  fontFamily="sans-serif"
                  fontWeight="600"
                  alignmentBaseline="middle"
                >
                  {ann.data.text}
                </text>
              </g>
            );
          }

          return null;
        })}

        {/* In-Progress Live Stroke */}
        {isDrawing && (activeTool === "PEN" || activeTool === "HIGHLIGHT") && (
          <path
            d={buildSvgPath(currentPoints)}
            stroke={color}
            strokeWidth={activeTool === "HIGHLIGHT" ? strokeWidth * 4 : strokeWidth}
            strokeLinecap={activeTool === "HIGHLIGHT" ? "square" : "round"}
            strokeLinejoin="round"
            fill="none"
            opacity={activeTool === "HIGHLIGHT" ? 0.35 : 1}
          />
        )}

        {/* In-Progress Live Arrow */}
        {isDrawing && activeTool === "ARROW" && dragStart && dragCurrent && (
          <line
            x1={dragStart.x * pageWidth}
            y1={dragStart.y * pageHeight}
            x2={dragCurrent.x * pageWidth}
            y2={dragCurrent.y * pageHeight}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray="4 4"
          />
        )}

        {/* In-Progress Live Rectangle */}
        {isDrawing && activeTool === "RECTANGLE" && dragStart && dragCurrent && (
          <rect
            x={Math.min(dragStart.x, dragCurrent.x) * pageWidth}
            y={Math.min(dragStart.y, dragCurrent.y) * pageHeight}
            width={Math.abs(dragCurrent.x - dragStart.x) * pageWidth}
            height={Math.abs(dragCurrent.y - dragStart.y) * pageHeight}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray="4 4"
            fill={`${color}15`}
            rx={4}
          />
        )}
      </svg>

      {/* Selected Item Floating Delete Button */}
      {selectedId && (
        <div
          className="absolute z-30"
          style={{
            top: 10,
            right: 10,
          }}
        >
          <button
            type="button"
            onClick={() => {
              onDeleteAnnotation(selectedId);
              setSelectedId(null);
            }}
            className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-medium shadow-lg animate-in fade-in"
          >
            <Trash2 className="h-3 w-3" />
            Excluir Anotação Selecionada
          </button>
        </div>
      )}

      {/* Inline Text Input Box */}
      {textPrompt && (
        <form
          onSubmit={handleTextSubmit}
          className="absolute z-30 bg-neutral-900 border border-purple-500 rounded p-1 shadow-2xl animate-in zoom-in-95"
          style={{
            left: `${textPrompt.x * 100}%`,
            top: `${textPrompt.y * 100}%`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            value={textPrompt.text}
            onChange={(e) =>
              setTextPrompt((prev) => (prev ? { ...prev, text: e.target.value } : null))
            }
            onBlur={handleTextSubmit}
            placeholder="Digite aqui..."
            className="bg-neutral-950 text-xs text-white px-2 py-1 rounded border border-neutral-700 focus:outline-none focus:border-purple-400 font-sans"
            autoFocus
          />
        </form>
      )}
    </div>
  );
}
