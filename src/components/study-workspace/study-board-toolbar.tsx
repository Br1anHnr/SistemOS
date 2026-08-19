"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  MousePointer,
  Type,
  FileText,
  PenLine,
  MoveUpRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Loader2,
  Check,
} from "lucide-react";

export type BoardTool = "SELECT" | "TEXT" | "NOTE" | "PEN" | "ARROW";

interface StudyBoardToolbarProps {
  activeTool: BoardTool;
  onSelectTool: (tool: BoardTool) => void;
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
  zoom,
  onZoomIn,
  onZoomOut,
  onResetView,
  isSaving,
  lastSavedAt,
}: StudyBoardToolbarProps) {
  const tools = [
    { id: "SELECT" as BoardTool, label: "Seleção", icon: MousePointer },
    { id: "TEXT" as BoardTool, label: "Texto", icon: Type },
    { id: "NOTE" as BoardTool, label: "Nota de Estudo", icon: FileText },
    { id: "PEN" as BoardTool, label: "Caneta", icon: PenLine },
    { id: "ARROW" as BoardTool, label: "Seta Conectora", icon: MoveUpRight },
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
