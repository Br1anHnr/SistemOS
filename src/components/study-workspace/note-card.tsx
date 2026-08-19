"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  AlertTriangle,
  HelpCircle,
  Binary,
  Flame,
  Trash2,
  Check,
  Loader2,
  ArrowRight,
  MapPin,
  Crop,
} from "lucide-react";
import { updateTopicNoteAction, deleteTopicNoteAction } from "@/actions/topic-note.actions";
import { useToast } from "@/components/ui/toast";
import { PdfNoteAnchorItem } from "@/services/pdf-note-anchor.service";

export interface TopicNoteItem {
  id: string;
  topicId: string;
  materialId?: string | null;
  type: "NOTE" | "IMPORTANT" | "QUESTION" | "FORMULA" | "EXAM";
  content: string;
  pageNumber?: number | null;
  anchor?: PdfNoteAnchorItem | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export const NOTE_TYPE_CONFIG = {
  NOTE: {
    label: "Anotação",
    color: "bg-blue-950/40 text-blue-300 border-blue-800/60",
    icon: FileText,
    badgeText: "📝 Anotação",
  },
  IMPORTANT: {
    label: "Importante",
    color: "bg-amber-950/40 text-amber-300 border-amber-800/60",
    icon: AlertTriangle,
    badgeText: "⭐ Importante",
  },
  QUESTION: {
    label: "Dúvida",
    color: "bg-rose-950/40 text-rose-300 border-rose-800/60",
    icon: HelpCircle,
    badgeText: "❓ Dúvida",
  },
  FORMULA: {
    label: "Fórmula",
    color: "bg-purple-950/40 text-purple-300 border-purple-800/60",
    icon: Binary,
    badgeText: "🧮 Fórmula",
  },
  EXAM: {
    label: "Cai na prova",
    color: "bg-red-950/40 text-red-300 border-red-800/60",
    icon: Flame,
    badgeText: "⚠️ Cai na prova",
  },
} as const;

interface NoteCardProps {
  note: TopicNoteItem;
  subjectId?: string;
  isHighlighted?: boolean;
  onSelect?: () => void;
  onNavigateToPage?: (pageNumber: number) => void;
  onDeleted?: (id: string) => void;
}

export function NoteCard({
  note,
  subjectId,
  isHighlighted = false,
  onSelect,
  onNavigateToPage,
  onDeleted,
}: NoteCardProps) {
  const { toast } = useToast();
  const [content, setContent] = React.useState(note.content);
  const [type, setType] = React.useState<
    "NOTE" | "IMPORTANT" | "QUESTION" | "FORMULA" | "EXAM"
  >(note.type || "NOTE");
  const [pageNumber, setPageNumber] = React.useState<number | null>(
    note.pageNumber ?? null
  );

  const [saving, setSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);

  const config = NOTE_TYPE_CONFIG[type] || NOTE_TYPE_CONFIG.NOTE;

  // Debounced auto-save on content or type change
  React.useEffect(() => {
    if (content === note.content && type === note.type && pageNumber === note.pageNumber) {
      return;
    }

    const timer = setTimeout(async () => {
      if (!content.trim()) return;
      setSaving(true);
      try {
        const res = await updateTopicNoteAction(
          note.id,
          {
            content: content.trim(),
            type,
            pageNumber,
          },
          subjectId
        );
        if (res.success) {
          setLastSaved(new Date());
        }
      } catch {
        // Silently fail on autosave
      } finally {
        setSaving(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [content, type, pageNumber, note.id, note.content, note.type, note.pageNumber, subjectId]);

  const handleDelete = async () => {
    if (!confirm("Deseja excluir esta anotação?")) return;
    try {
      const res = await deleteTopicNoteAction(note.id, subjectId);
      if (res.success) {
        toast("Anotação removida.");
        onDeleted?.(note.id);
      } else {
        toast(res.error || "Erro ao remover.", "error");
      }
    } catch {
      toast("Erro ao excluir anotação.", "error");
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`rounded-lg border p-3 space-y-2.5 transition-all cursor-pointer ${
        isHighlighted
          ? "border-purple-500 bg-purple-950/30 ring-2 ring-purple-500/50 shadow-lg"
          : "border-neutral-800 bg-neutral-950/70 hover:border-neutral-750"
      }`}
    >
      {/* Header with Type, Anchor Badge, Page button, Autosave and Delete */}
      <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Type Selector / Badge */}
          <select
            value={type}
            onChange={(e) =>
              setType(
                e.target.value as "NOTE" | "IMPORTANT" | "QUESTION" | "FORMULA" | "EXAM"
              )
            }
            className={`text-[10px] font-medium px-2 py-0.5 rounded border focus:outline-none cursor-pointer bg-neutral-900 ${config.color}`}
          >
            <option value="NOTE">Anotação</option>
            <option value="IMPORTANT">⭐ Importante</option>
            <option value="QUESTION">❓ Dúvida</option>
            <option value="FORMULA">🧮 Fórmula</option>
            <option value="EXAM">⚠️ Cai na prova</option>
          </select>

          {/* Anchor Indicator Badge (Point or Region) */}
          {note.anchor && (
            <span
              className={`inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                note.anchor.anchorType === "REGION"
                  ? "bg-indigo-950/50 text-indigo-300 border-indigo-800/60"
                  : "bg-purple-950/50 text-purple-300 border-purple-800/60"
              }`}
              title={
                note.anchor.anchorType === "REGION"
                  ? "Trecho de imagem/fórmula recortado do slide"
                  : "Ponto marcado no slide"
              }
            >
              {note.anchor.anchorType === "REGION" ? (
                <>
                  <Crop className="h-2.5 w-2.5" /> Trecho
                </>
              ) : (
                <>
                  <MapPin className="h-2.5 w-2.5" /> Pin
                </>
              )}
            </span>
          )}

          {/* Page Link / Jump Button */}
          {pageNumber ? (
            <button
              type="button"
              onClick={() => onNavigateToPage?.(pageNumber)}
              className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-950/50 text-purple-300 border border-purple-800/60 hover:bg-purple-900/60 transition-colors"
              title={`Ir para página ${pageNumber} do PDF`}
            >
              <span>p. {pageNumber}</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 text-neutral-500">
          {/* Saving Indicator */}
          {saving ? (
            <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
              <Loader2 className="h-2.5 w-2.5 animate-spin" /> Salvando
            </span>
          ) : lastSaved ? (
            <span className="text-[10px] text-emerald-400 font-mono">Salvo</span>
          ) : null}

          {/* Delete */}
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
            title="Excluir anotação"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Editable Content */}
      <div onClick={(e) => e.stopPropagation()}>
        <textarea
          rows={Math.max(2, Math.min(6, content.split("\n").length))}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva sua anotação, dúvida ou fórmula..."
          className="w-full bg-transparent text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-purple-500/40 rounded p-1 font-sans resize-none"
        />
      </div>
    </div>
  );
}
