"use client";

import * as React from "react";
import {
  Bookmark,
  AlertTriangle,
  HelpCircle,
  Star,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { deleteMaterialBookmarkAction } from "@/actions/material-bookmark.actions";
import { useToast } from "@/components/ui/toast";

export interface MaterialBookmarkItem {
  id: string;
  topicId: string;
  materialId: string;
  pageNumber: number;
  title: string;
  type: "BOOKMARK" | "IMPORTANT" | "EXAM" | "QUESTION";
  createdAt: Date | string;
  updatedAt: Date | string;
}

export const BOOKMARK_TYPE_CONFIG = {
  BOOKMARK: {
    label: "Marcador",
    color: "text-blue-300 bg-blue-950/40 border-blue-800/60",
    icon: Bookmark,
    badgeText: "🔖 Marcador",
  },
  IMPORTANT: {
    label: "Importante",
    color: "text-amber-300 bg-amber-950/40 border-amber-800/60",
    icon: Star,
    badgeText: "⭐ Importante",
  },
  EXAM: {
    label: "Cai na prova",
    color: "text-red-300 bg-red-950/40 border-red-800/60",
    icon: AlertTriangle,
    badgeText: "⚠️ Cai na prova",
  },
  QUESTION: {
    label: "Dúvida",
    color: "text-rose-300 bg-rose-950/40 border-rose-800/60",
    icon: HelpCircle,
    badgeText: "❓ Dúvida",
  },
} as const;

interface BookmarkCardProps {
  bookmark: MaterialBookmarkItem;
  subjectId?: string;
  onNavigateToPage?: (pageNumber: number) => void;
  onDeleted?: (id: string) => void;
}

export function BookmarkCard({
  bookmark,
  subjectId,
  onNavigateToPage,
  onDeleted,
}: BookmarkCardProps) {
  const { toast } = useToast();
  const config = BOOKMARK_TYPE_CONFIG[bookmark.type] || BOOKMARK_TYPE_CONFIG.BOOKMARK;
  const Icon = config.icon;

  const handleDelete = async () => {
    if (!confirm(`Deseja excluir o marcador "${bookmark.title}"?`)) return;
    try {
      const res = await deleteMaterialBookmarkAction(bookmark.id, subjectId);
      if (res.success) {
        toast("Marcador excluído.");
        onDeleted?.(bookmark.id);
      } else {
        toast(res.error || "Erro ao excluir.", "error");
      }
    } catch {
      toast("Erro ao excluir marcador.", "error");
    }
  };

  return (
    <div
      onClick={() => onNavigateToPage?.(bookmark.pageNumber)}
      className="group flex items-center justify-between gap-2.5 p-2.5 rounded-lg border border-neutral-800 bg-neutral-950/60 hover:bg-neutral-900/60 hover:border-neutral-700 cursor-pointer transition-all"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`p-1.5 rounded-md border text-xs shrink-0 flex items-center justify-center ${config.color}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>

        <div className="min-w-0">
          <div className="text-xs font-semibold text-neutral-200 truncate group-hover:text-white transition-colors">
            {bookmark.title}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
            <span className="font-mono text-purple-300">Pág. {bookmark.pageNumber}</span>
            <span>•</span>
            <span>{config.label}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onNavigateToPage?.(bookmark.pageNumber)}
          className="p-1 text-neutral-400 hover:text-purple-300 transition-colors"
          title={`Ir para página ${bookmark.pageNumber}`}
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
          title="Excluir marcador"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
