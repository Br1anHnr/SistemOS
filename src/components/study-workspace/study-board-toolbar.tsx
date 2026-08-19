"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  MousePointer,
  Type,
  FileText,
  PenLine,
  MoveUpRight,
  Eraser,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Loader2,
  Check,
} from "lucide-react";

export type BoardTool = "SELECT" | "TEXT" | "NOTE" | "PEN" | "ARROW" | "ERASER";

export const BOARD_COLORS = [
  { value: "#ffffff", label: "Branco" },
  { value: "#9ca3af", label: "Cinza" },
  { value: "#ef4444", label: "Vermelho" },
  { value: "#f59e0b", label: "Laranja/Amarelo" },
  { value: "#10b981", label: "Verde" },
  { value: "#3b82f6", label: "Azul" },
  { value: "#a855f7", label: "Roxo" },
  { value: "#ec4899", label: "Rosa" },
];

export const BOARD_STROKE_WIDTHS = [
  { value: 2, label: "Fino (2px)" },
  { value: 4, label: "Médio (4px)" },
  { value: 8, label: "Grosso (8px)" },
];

interface StudyBoardToolbarProps {
  activeTool: BoardTool;
  onSelectTool: (tool: BoardTool) => void;
  color: string;
  onChangeColor: (color: string) => void;
  strokeWidth: number;
  onChangeStrokeWidth: (width: number) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  isSaving: boolean;
  lastSavedAt?: Date | null;
}

export function StudyBoardToolbar({
  activeTool,
  onSelectTool,
  color,
  onChangeColor,
  strokeWidth,
  onChangeStrokeWidth,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  isSaving,
  lastSavedAt,
}: StudyBoardToolbarProps) {
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showStrokePicker, setShowStrokePicker] = React.useState(false);

  const tools = [
    { id: "SELECT" as BoardTool, label: "Seleção (V)", icon: MousePointer },
    { id: "TEXT" as BoardTool, label: "Texto Livre (T)", icon: Type },
    { id: "NOTE" as BoardTool, label: "Nota / Card (N)", icon: FileText },
    { id: "PEN" as BoardTool, label: "Caneta (P)", icon: PenLine },
    { id: "ARROW" as BoardTool, label: "Seta Conectora (A)", icon: MoveUpRight },
    { id: "ERASER" as BoardTool, label: "Borracha (E)", icon: Eraser },
  ];

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/95 backdrop-blur-md border border-neutral-750 rounded-xl shadow-2xl text-xs text-neutral-200 select-none animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Tools Group */}
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

      {/* Color Picker Popover */}
      {(activeTool === "PEN" || activeTool === "ARROW" || activeTool === "TEXT") && (
        <div className="relative flex items-center border-r border-neutral-800 pr-2">
          <button
            type="button"
            onClick={() => {
              setShowColorPicker((prev) => !prev);
              setShowStrokePicker(false);
            }}
            className="p-1 rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1"
            title="Escolher Cor"
          >
            <div
              className="w-4 h-4 rounded-full border border-neutral-600 shadow-sm"
              style={{ backgroundColor: color }}
            />
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 p-2 bg-neutral-950 border border-neutral-800 rounded-lg shadow-2xl flex items-center gap-1.5 z-50">
              {BOARD_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => {
                    onChangeColor(c.value);
                    setShowColorPicker(false);
                  }}
                  className={`w-5 h-5 rounded-full border transition-transform hover:scale-125 ${
                    color === c.value
                      ? "border-white ring-2 ring-purple-500 scale-110"
                      : "border-neutral-700"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stroke Width Selector */}
      {(activeTool === "PEN" || activeTool === "ARROW") && (
        <div className="relative flex items-center border-r border-neutral-800 pr-2">
          <button
            type="button"
            onClick={() => {
              setShowStrokePicker((prev) => !prev);
              setShowColorPicker(false);
            }}
            className="p-1 rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1 text-[11px] font-mono text-neutral-300"
            title="Espessura do Traço"
          >
            <div
              className="rounded-full bg-white"
              style={{ width: strokeWidth * 2, height: strokeWidth * 2, minWidth: 4, minHeight: 4 }}
            />
            <span>{strokeWidth}px</span>
          </button>

          {showStrokePicker && (
            <div className="absolute top-full left-0 mt-2 p-1.5 bg-neutral-950 border border-neutral-800 rounded-lg shadow-2xl flex flex-col gap-1 z-50 min-w-[110px]">
              {BOARD_STROKE_WIDTHS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => {
                    onChangeStrokeWidth(s.value);
                    setShowStrokePicker(false);
                  }}
                  className={`px-2 py-1 rounded text-left flex items-center justify-between text-xs transition-colors ${
                    strokeWidth === s.value
                      ? "bg-purple-600 text-white font-semibold"
                      : "text-neutral-300 hover:bg-neutral-800"
                  }`}
                >
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Undo & Redo */}
      <div className="flex items-center gap-0.5 border-r border-neutral-800 pr-2">
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

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 border-r border-neutral-800 pr-2">
        <button
          type="button"
          onClick={onZoomOut}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Diminuir Zoom"
        >
          <ZoomOut className="h-4 w-4" />
        </button>

        <span className="font-mono text-[11px] px-1 text-center min-w-[38px]">
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={onZoomIn}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          title="Aumentar Zoom"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onResetView}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors ml-0.5"
          title="Centralizar Visualização"
        >
          <Maximize className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Auto-save Status */}
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
