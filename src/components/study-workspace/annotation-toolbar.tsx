"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  MousePointer,
  PenLine,
  Highlighter,
  MoveUpRight,
  Square,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Eye,
  EyeOff,
  Loader2,
  Check,
} from "lucide-react";

export type AnnotationTool =
  | "SELECT"
  | "PEN"
  | "HIGHLIGHT"
  | "ARROW"
  | "RECTANGLE"
  | "TEXT"
  | "ERASER";

export interface AnnotationToolbarProps {
  activeTool: AnnotationTool;
  onSelectTool: (tool: AnnotationTool) => void;
  color: string;
  onChangeColor: (color: string) => void;
  strokeWidth: number;
  onChangeStrokeWidth: (width: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
  isSaving: boolean;
  lastSavedAt?: Date | null;
}

export const COLOR_PALETTE = [
  { label: "Amarelo", value: "#eab308", border: "border-yellow-500" },
  { label: "Vermelho", value: "#ef4444", border: "border-red-500" },
  { label: "Verde", value: "#22c55e", border: "border-green-500" },
  { label: "Azul", value: "#3b82f6", border: "border-blue-500" },
  { label: "Roxo", value: "#a855f7", border: "border-purple-500" },
  { label: "Branco", value: "#ffffff", border: "border-neutral-200" },
];

export const STROKE_WIDTHS = [
  { label: "Fino", value: 2 },
  { label: "Médio", value: 4 },
  { label: "Grosso", value: 8 },
];

export function AnnotationToolbar({
  activeTool,
  onSelectTool,
  color,
  onChangeColor,
  strokeWidth,
  onChangeStrokeWidth,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isVisible,
  onToggleVisibility,
  isSaving,
  lastSavedAt,
}: AnnotationToolbarProps) {
  const tools = [
    { id: "SELECT" as AnnotationTool, label: "Seleção", icon: MousePointer },
    { id: "PEN" as AnnotationTool, label: "Caneta", icon: PenLine },
    { id: "HIGHLIGHT" as AnnotationTool, label: "Marca-texto", icon: Highlighter },
    { id: "ARROW" as AnnotationTool, label: "Seta", icon: MoveUpRight },
    { id: "RECTANGLE" as AnnotationTool, label: "Retângulo", icon: Square },
    { id: "TEXT" as AnnotationTool, label: "Texto", icon: Type },
    { id: "ERASER" as AnnotationTool, label: "Borracha", icon: Eraser },
  ];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/95 backdrop-blur-md border border-neutral-750 rounded-xl shadow-2xl text-xs text-neutral-200 select-none animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Tool Selector Group */}
      <div className="flex items-center gap-1 border-r border-neutral-800 pr-2">
        {tools.map((t) => {
          const Icon = t.icon;
          const isSelected = activeTool === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTool(t.id)}
              className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                isSelected
                  ? "bg-purple-600 text-white shadow-sm ring-1 ring-purple-400"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
              title={t.label}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>

      {/* Color Palette (Active for Pen, Highlight, Arrow, Rectangle, Text) */}
      {activeTool !== "ERASER" && activeTool !== "SELECT" && (
        <div className="flex items-center gap-1.5 border-r border-neutral-800 pr-2">
          {COLOR_PALETTE.map((c) => {
            const isSelected = color === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => onChangeColor(c.value)}
                style={{ backgroundColor: c.value }}
                className={`h-4 w-4 rounded-full transition-transform border border-black/30 ${
                  isSelected ? "scale-125 ring-2 ring-purple-400" : "hover:scale-110 opacity-80"
                }`}
                title={c.label}
              />
            );
          })}
        </div>
      )}

      {/* Stroke Width Selector */}
      {activeTool !== "ERASER" && activeTool !== "SELECT" && activeTool !== "TEXT" && (
        <div className="flex items-center gap-1 border-r border-neutral-800 pr-2">
          {STROKE_WIDTHS.map((s) => {
            const isSelected = strokeWidth === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => onChangeStrokeWidth(s.value)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  isSelected
                    ? "bg-purple-950 text-purple-200 border border-purple-800"
                    : "text-neutral-400 hover:text-white"
                }`}
                title={`Espessura: ${s.label}`}
              >
                {s.label[0]}
              </button>
            );
          })}
        </div>
      )}

      {/* Undo / Redo */}
      <div className="flex items-center gap-1 border-r border-neutral-800 pr-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Desfazer (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          title="Refazer (Ctrl+Y)"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      {/* Show / Hide Annotations Layer */}
      <div className="flex items-center gap-1 border-r border-neutral-800 pr-2">
        <button
          type="button"
          onClick={onToggleVisibility}
          className={`p-1.5 rounded-lg transition-colors ${
            isVisible
              ? "text-purple-300 hover:bg-neutral-800"
              : "text-neutral-500 hover:text-neutral-300 bg-neutral-800/80"
          }`}
          title={isVisible ? "Ocultar anotações" : "Mostrar anotações"}
        >
          {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
      </div>

      {/* Auto-save Status Indicator */}
      <div className="flex items-center gap-1 font-mono text-[10px] pl-1">
        {isSaving ? (
          <span className="text-amber-400 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Salvando...
          </span>
        ) : lastSavedAt ? (
          <span className="text-emerald-400 flex items-center gap-1">
            <Check className="h-3 w-3" /> Salvo
          </span>
        ) : null}
      </div>
    </div>
  );
}
