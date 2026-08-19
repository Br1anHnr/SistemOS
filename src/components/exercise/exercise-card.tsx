"use client";

import * as React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  BookOpen,
  ListOrdered,
  Image as ImageIcon,
  ChevronRight,
  Plus,
  Eye,
  Camera,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExerciseItem } from "@/domain/exercises";
import { getLocalFileUrl } from "@/lib/file-storage";

interface ExerciseCardProps {
  exercise: ExerciseItem;
  onOpenDetail: (exercise: ExerciseItem) => void;
  onNewAttempt?: (exercise: ExerciseItem) => void;
}

export function ExerciseCard({
  exercise,
  onOpenDetail,
  onNewAttempt,
}: ExerciseCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = React.useState<string | null>(null);

  // Resolve first statement image thumbnail if exists
  React.useEffect(() => {
    async function resolveThumb() {
      if (exercise.attachments && exercise.attachments.length > 0) {
        const first = exercise.attachments[0];
        const url = await getLocalFileUrl(first.filePath);
        setThumbnailUrl(url);
      } else {
        setThumbnailUrl(null);
      }
    }
    resolveThumb();
  }, [exercise.attachments]);

  const attemptsCount = exercise.attempts?.length || 0;
  const hasAttempts = attemptsCount > 0;

  // Count total resolution photos from all attempts
  const resolutionPhotosCount = React.useMemo(() => {
    if (!exercise.attempts) return 0;
    return exercise.attempts.reduce((acc, att) => acc + (att.attachments?.length || 0), 0);
  }, [exercise.attempts]);

  return (
    <div
      onClick={() => onOpenDetail(exercise)}
      className="group relative bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-sm flex flex-col justify-between"
    >
      <div>
        {/* Top Header: Reference / Title & Status Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {exercise.referenceNumber ? (
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-purple-950/70 border border-purple-800 text-purple-300 shrink-0">
                {exercise.referenceNumber}
              </span>
            ) : null}

            <h4 className="text-xs font-semibold text-neutral-100 group-hover:text-purple-300 transition-colors truncate">
              {exercise.title}
            </h4>
          </div>

          <div className="shrink-0 flex items-center gap-1.5">
            {exercise.status === "RESOLVED" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                <CheckCircle2 className="h-3 w-3" />
                Resolvido
              </span>
            )}
            {exercise.status === "PARTIALLY_CORRECT" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950/80 text-amber-300 border border-amber-800">
                <AlertTriangle className="h-3 w-3" />
                Parcial
              </span>
            )}
            {exercise.status === "WRONG" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-950/80 text-rose-300 border border-rose-800">
                <XCircle className="h-3 w-3" />
                Errado
              </span>
            )}
            {exercise.status === "REVIEW" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-950/80 text-purple-300 border border-purple-800">
                <RotateCcw className="h-3 w-3" />
                Refazer
              </span>
            )}
            {exercise.status === "PENDING" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-900 text-neutral-400 border border-neutral-800">
                Pendente
              </span>
            )}
          </div>
        </div>

        {/* Content Preview: Thumbnail + Statement Snippet */}
        <div className="mt-3 flex gap-3">
          {thumbnailUrl && (
            <div className="w-16 h-16 rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src={thumbnailUrl}
                alt="Enunciado"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {exercise.statement ? (
              <p className="text-xs text-neutral-300 line-clamp-3 leading-relaxed font-sans">
                {exercise.statement}
              </p>
            ) : thumbnailUrl ? (
              <p className="text-xs text-neutral-400 italic flex items-center gap-1">
                <ImageIcon className="h-3 w-3 text-purple-400" />
                Enunciado com imagem anexada
              </p>
            ) : (
              <p className="text-xs text-neutral-500 italic">
                Sem texto de enunciado cadastrado.
              </p>
            )}
          </div>
        </div>

        {/* Context Tags: Chapter, Set, Source */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2 border-t border-neutral-850 text-[11px]">
          {exercise.topicTitle && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-900 text-neutral-300 border border-neutral-800 max-w-[160px] truncate">
              <BookOpen className="h-2.5 w-2.5 text-neutral-500" />
              {exercise.topicTitle}
            </span>
          )}

          {exercise.exerciseSetTitle && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-950/30 text-purple-300 border border-purple-800/50 max-w-[160px] truncate">
              <ListOrdered className="h-2.5 w-2.5 text-purple-400" />
              {exercise.exerciseSetTitle}
            </span>
          )}

          {exercise.source && (
            <span className="text-[10px] text-neutral-500 truncate">
              {exercise.source}
              {exercise.sourcePage ? ` p.${exercise.sourcePage}` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Footer: Attempts / Photos Stats & Contextual CTA */}
      <div className="mt-4 pt-2.5 border-t border-neutral-850 flex items-center justify-between gap-2">
        {/* Left Stats Indicator */}
        <div className="flex items-center gap-2 text-[11px] text-neutral-400">
          {hasAttempts ? (
            <>
              <span className="font-medium text-neutral-300">
                {attemptsCount} {attemptsCount === 1 ? "tentativa" : "tentativas"}
              </span>
              {resolutionPhotosCount > 0 && (
                <span className="flex items-center gap-1 text-purple-300 text-[10px] font-medium">
                  <Camera className="h-3 w-3" />
                  {resolutionPhotosCount} {resolutionPhotosCount === 1 ? "foto" : "fotos"}
                </span>
              )}
            </>
          ) : (
            <span className="text-neutral-500">Nenhuma tentativa</span>
          )}
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {hasAttempts ? (
            <>
              {onNewAttempt && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onNewAttempt(exercise)}
                  className="h-7 px-2 text-[11px] text-neutral-400 hover:text-white"
                  title="Registrar nova tentativa"
                >
                  <Plus className="h-3 w-3 mr-0.5" />
                  Nova tentativa
                </Button>
              )}

              <Button
                size="sm"
                onClick={() => onOpenDetail(exercise)}
                className="h-7 px-2.5 text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-sm gap-1"
              >
                <Eye className="h-3 w-3" />
                Ver resolução
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => onOpenDetail(exercise)}
              className="h-7 px-2.5 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 text-neutral-200 hover:text-white font-medium gap-1"
            >
              <span>Resolver</span>
              <ChevronRight className="h-3 w-3 text-neutral-500" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
