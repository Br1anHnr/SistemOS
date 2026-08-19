"use client";

import * as React from "react";
import {
  Calendar,
  Award,
  FileText,
  Edit2,
  Trash2,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExerciseSetItem } from "@/domain/exercises";

interface ExerciseSetCardProps {
  set: ExerciseSetItem;
  onOpenSet: (set: ExerciseSetItem) => void;
  onEditSet: (set: ExerciseSetItem) => void;
  onDeleteSet: (setId: string, title: string) => void;
}

export function ExerciseSetCard({
  set,
  onOpenSet,
  onEditSet,
  onDeleteSet,
}: ExerciseSetCardProps) {
  const progress = set.progress || {
    total: 0,
    triedCount: 0,
    resolvedCount: 0,
    partialCount: 0,
    wrongCount: 0,
    reviewCount: 0,
    pendingCount: 0,
    progressPercentage: 0,
    successRate: 0,
  };

  return (
    <div
      onClick={() => onOpenSet(set)}
      className="group relative bg-neutral-950/70 hover:bg-neutral-900/80 border border-neutral-800 hover:border-purple-500/60 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-sm flex flex-col justify-between"
    >
      <div>
        {/* Top Header: Title + Action Buttons */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-neutral-100 group-hover:text-purple-300 transition-colors truncate">
              {set.title}
            </h4>
            {set.description && (
              <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2">
                {set.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditSet(set)}
              className="h-7 w-7 p-0 text-neutral-400 hover:text-white"
              title="Editar lista"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteSet(set.id, set.title)}
              className="h-7 w-7 p-0 text-neutral-400 hover:text-red-400"
              title="Excluir lista"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Badges: Assessment & Due Date & Source File */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {set.assessmentTitle && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-950/50 text-blue-300 border border-blue-800/60">
              <Award className="h-2.5 w-2.5 text-blue-400" />
              {set.assessmentTitle}
              {set.assessmentDate ? ` • ${set.assessmentDate}` : ""}
            </span>
          )}

          {set.dueDate && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-900 text-neutral-400 border border-neutral-800">
              <Calendar className="h-2.5 w-2.5 text-neutral-500" />
              Prazo: {set.dueDate}
            </span>
          )}

          {set.sourceFileName && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/40 text-purple-300 border border-purple-800/60">
              <FileText className="h-2.5 w-2.5" />
              {set.sourceFileName}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Progress Bar & Stats */}
      <div className="mt-4 pt-3 border-t border-neutral-850">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-neutral-400 font-medium text-[11px]">
            {progress.total} {progress.total === 1 ? "exercício" : "exercícios"}
          </span>
          <span className="font-mono font-semibold text-neutral-200 text-[11px]">
            {progress.progressPercentage}%
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{
              width: `${
                progress.total > 0
                  ? (progress.resolvedCount / progress.total) * 100
                  : 0
              }%`,
            }}
            title={`${progress.resolvedCount} resolvidos`}
          />
          <div
            className="bg-amber-500 h-full transition-all duration-300"
            style={{
              width: `${
                progress.total > 0
                  ? (progress.partialCount / progress.total) * 100
                  : 0
              }%`,
            }}
            title={`${progress.partialCount} parciais`}
          />
          <div
            className="bg-purple-500 h-full transition-all duration-300"
            style={{
              width: `${
                progress.total > 0
                  ? (progress.reviewCount / progress.total) * 100
                  : 0
              }%`,
            }}
            title={`${progress.reviewCount} para refazer`}
          />
          <div
            className="bg-rose-500 h-full transition-all duration-300"
            style={{
              width: `${
                progress.total > 0
                  ? (progress.wrongCount / progress.total) * 100
                  : 0
              }%`,
            }}
            title={`${progress.wrongCount} errados`}
          />
        </div>

        {/* Detailed Breakdown */}
        <div className="flex items-center justify-between mt-2 text-[10px] text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="h-2.5 w-2.5" />
              {progress.resolvedCount}
            </span>
            {progress.reviewCount > 0 && (
              <span className="flex items-center gap-1 text-purple-400 font-medium">
                <RotateCcw className="h-2.5 w-2.5" />
                {progress.reviewCount}
              </span>
            )}
            <span className="text-neutral-500">
              {progress.pendingCount} pendentes
            </span>
          </div>

          <span className="flex items-center text-purple-400 group-hover:translate-x-0.5 transition-transform font-medium">
            Abrir
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
