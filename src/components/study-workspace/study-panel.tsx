"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  NoteCard,
  TopicNoteItem,
  NOTE_TYPE_CONFIG,
} from "./note-card";
import {
  BookmarkCard,
  MaterialBookmarkItem,
  BOOKMARK_TYPE_CONFIG,
} from "./bookmark-card";
import {
  createTopicNoteAction,
  getTopicNotesAction,
} from "@/actions/topic-note.actions";
import {
  createMaterialBookmarkAction,
  getTopicBookmarksAction,
} from "@/actions/material-bookmark.actions";
import { useToast } from "@/components/ui/toast";
import {
  Plus,
  Bookmark,
  FileText,
  AlertTriangle,
  HelpCircle,
  Binary,
  Loader2,
  ChevronRight,
  Layers,
  Sparkles,
} from "lucide-react";

interface StudyPanelProps {
  topicId: string;
  topicTitle: string;
  materialId?: string | null;
  subjectId?: string;
  currentPageNumber: number;
  initialNotes?: TopicNoteItem[];
  initialBookmarks?: MaterialBookmarkItem[];
  onNavigateToPage: (pageNumber: number) => void;
  onCollapse: () => void;
}

type TabType = "ALL" | "NOTE" | "IMPORTANT" | "QUESTION" | "FORMULA" | "BOOKMARKS";

export function StudyPanel({
  topicId,
  topicTitle,
  materialId,
  subjectId,
  currentPageNumber,
  initialNotes = [],
  initialBookmarks = [],
  onNavigateToPage,
  onCollapse,
}: StudyPanelProps) {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = React.useState<TabType>("ALL");
  const [notes, setNotes] = React.useState<TopicNoteItem[]>(initialNotes);
  const [bookmarks, setBookmarks] = React.useState<MaterialBookmarkItem[]>(
    initialBookmarks
  );
  const [loading, setLoading] = React.useState(false);

  // Form mode: "NONE" | "NOTE" | "BOOKMARK"
  const [formMode, setFormMode] = React.useState<"NONE" | "NOTE" | "BOOKMARK">("NONE");

  // New Note Form
  const [newNoteType, setNewNoteType] = React.useState<
    "NOTE" | "IMPORTANT" | "QUESTION" | "FORMULA"
  >("NOTE");
  const [newNoteContent, setNewNoteContent] = React.useState("");
  const [newNotePage, setNewNotePage] = React.useState<number>(currentPageNumber);
  const [savingNote, setSavingNote] = React.useState(false);

  // New Bookmark Form
  const [newBookmarkTitle, setNewBookmarkTitle] = React.useState("");
  const [newBookmarkType, setNewBookmarkType] = React.useState<
    "BOOKMARK" | "IMPORTANT" | "EXAM" | "QUESTION"
  >("BOOKMARK");
  const [newBookmarkPage, setNewBookmarkPage] = React.useState<number>(currentPageNumber);
  const [savingBookmark, setSavingBookmark] = React.useState(false);

  // Sync current page number with open forms
  React.useEffect(() => {
    if (currentPageNumber > 0) {
      setNewNotePage(currentPageNumber);
      setNewBookmarkPage(currentPageNumber);
    }
  }, [currentPageNumber]);

  // Load notes & bookmarks when topicId changes
  React.useEffect(() => {
    async function loadData() {
      if (!topicId) return;
      setLoading(true);
      try {
        const [notesRes, bkmRes] = await Promise.all([
          getTopicNotesAction(topicId),
          getTopicBookmarksAction(topicId),
        ]);
        if (notesRes.success && notesRes.data) {
          setNotes(notesRes.data as TopicNoteItem[]);
        }
        if (bkmRes.success && bkmRes.data) {
          setBookmarks(bkmRes.data as MaterialBookmarkItem[]);
        }
      } catch {
        // Silently continue
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [topicId]);

  // Create Note Submit
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    setSavingNote(true);
    try {
      const res = await createTopicNoteAction(
        {
          topicId,
          materialId: materialId || null,
          type: newNoteType,
          content: newNoteContent.trim(),
          pageNumber: newNotePage > 0 ? newNotePage : null,
        },
        subjectId
      );

      if (res.success && res.data) {
        setNotes((prev) => [res.data as TopicNoteItem, ...prev]);
        setNewNoteContent("");
        setFormMode("NONE");
        toast("Anotação salva!");
      } else {
        toast(res.error || "Erro ao salvar anotação.", "error");
      }
    } catch {
      toast("Erro ao criar anotação.", "error");
    } finally {
      setSavingNote(false);
    }
  };

  // Create Bookmark Submit
  const handleCreateBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookmarkTitle.trim() || !materialId) {
      if (!materialId) {
        toast("Para criar um marcador, selecione um material associado.", "error");
      }
      return;
    }

    setSavingBookmark(true);
    try {
      const res = await createMaterialBookmarkAction(
        {
          topicId,
          materialId,
          title: newBookmarkTitle.trim(),
          pageNumber: newBookmarkPage > 0 ? newBookmarkPage : 1,
          type: newBookmarkType,
        },
        subjectId
      );

      if (res.success && res.data) {
        setBookmarks((prev) => [...prev, res.data as MaterialBookmarkItem]);
        setNewBookmarkTitle("");
        setFormMode("NONE");
        toast("Página marcada!");
      } else {
        toast(res.error || "Erro ao criar marcador.", "error");
      }
    } catch {
      toast("Erro ao salvar marcador.", "error");
    } finally {
      setSavingBookmark(false);
    }
  };

  // Filtered notes
  const filteredNotes = React.useMemo(() => {
    if (activeTab === "ALL") return notes;
    if (activeTab === "BOOKMARKS") return [];
    return notes.filter((n) => n.type === activeTab);
  }, [notes, activeTab]);

  const showBookmarks = activeTab === "ALL" || activeTab === "BOOKMARKS";

  return (
    <div className="flex flex-col h-full bg-neutral-950 border-l border-neutral-800 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-neutral-800 bg-neutral-900/80 shrink-0">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <Sparkles className="h-4 w-4 text-purple-400 shrink-0" />
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-neutral-100 truncate">
              Painel de Estudo
            </h4>
            <p className="text-[10px] text-neutral-400 truncate">
              {topicTitle}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onCollapse}
          className="h-7 text-xs px-2 text-neutral-400 hover:text-white"
          title="Recolher painel"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-2 border-b border-neutral-850 bg-neutral-900/40 overflow-x-auto text-[11px] shrink-0 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`px-2 py-1 rounded font-medium transition-colors shrink-0 ${
            activeTab === "ALL"
              ? "bg-purple-950/70 text-purple-200 border border-purple-800/80"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Todas ({notes.length + bookmarks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("NOTE")}
          className={`px-2 py-1 rounded font-medium transition-colors shrink-0 ${
            activeTab === "NOTE"
              ? "bg-blue-950/70 text-blue-200 border border-blue-800/80"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Notas ({notes.filter((n) => n.type === "NOTE").length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("IMPORTANT")}
          className={`px-2 py-1 rounded font-medium transition-colors shrink-0 ${
            activeTab === "IMPORTANT"
              ? "bg-amber-950/70 text-amber-200 border border-amber-800/80"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Importante ({notes.filter((n) => n.type === "IMPORTANT").length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("QUESTION")}
          className={`px-2 py-1 rounded font-medium transition-colors shrink-0 ${
            activeTab === "QUESTION"
              ? "bg-rose-950/70 text-rose-200 border border-rose-800/80"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Dúvidas ({notes.filter((n) => n.type === "QUESTION").length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("FORMULA")}
          className={`px-2 py-1 rounded font-medium transition-colors shrink-0 ${
            activeTab === "FORMULA"
              ? "bg-purple-950/70 text-purple-200 border border-purple-800/80"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Fórmulas ({notes.filter((n) => n.type === "FORMULA").length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("BOOKMARKS")}
          className={`px-2 py-1 rounded font-medium transition-colors shrink-0 ${
            activeTab === "BOOKMARKS"
              ? "bg-emerald-950/70 text-emerald-200 border border-emerald-800/80"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Marcadores ({bookmarks.length})
        </button>
      </div>

      {/* Action Bar (Add Note / Bookmark buttons) */}
      <div className="p-2.5 border-b border-neutral-850 flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          onClick={() => setFormMode(formMode === "NOTE" ? "NONE" : "NOTE")}
          className={`flex-1 h-7 text-xs ${
            formMode === "NOTE"
              ? "bg-neutral-800 text-white"
              : "bg-purple-600 hover:bg-purple-500 text-white"
          }`}
        >
          <Plus className="h-3 w-3 mr-1" />
          {formMode === "NOTE" ? "Fechar Form" : "Nova Nota"}
        </Button>

        {materialId && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFormMode(formMode === "BOOKMARK" ? "NONE" : "BOOKMARK")}
            className={`h-7 text-xs border-neutral-750 ${
              formMode === "BOOKMARK" ? "bg-neutral-800 text-white" : ""
            }`}
          >
            <Bookmark className="h-3 w-3 mr-1 text-emerald-400" />
            Marcar Pág. {currentPageNumber > 0 ? currentPageNumber : ""}
          </Button>
        )}
      </div>

      {/* Form Drawer (if open) */}
      {formMode === "NOTE" && (
        <form
          onSubmit={handleCreateNote}
          className="p-3 bg-neutral-900/90 border-b border-neutral-800 space-y-2.5 shrink-0"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-neutral-300">
              Adicionar Registro de Estudo
            </span>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-neutral-400">Pág:</label>
              <input
                type="number"
                min="1"
                max="999"
                value={newNotePage || ""}
                onChange={(e) => setNewNotePage(Number(e.target.value))}
                placeholder="Ex: 17"
                className="w-14 h-6 text-xs font-mono bg-neutral-950 border border-neutral-750 rounded px-1.5 text-center text-neutral-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 text-[10px]">
            {(["NOTE", "IMPORTANT", "QUESTION", "FORMULA"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setNewNoteType(t)}
                className={`py-1 rounded border text-center font-medium transition-colors ${
                  newNoteType === t
                    ? NOTE_TYPE_CONFIG[t].color + " ring-1 ring-white/20"
                    : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {NOTE_TYPE_CONFIG[t].label}
              </button>
            ))}
          </div>

          <textarea
            rows={3}
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Digite o resumo, fórmula ou dúvida..."
            className="w-full rounded border border-neutral-750 bg-neutral-950 px-2 py-1.5 text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-purple-500"
            autoFocus
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormMode("NONE")}
              className="h-6 text-xs text-neutral-400"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={savingNote || !newNoteContent.trim()}
              className="h-6 text-xs bg-purple-600 hover:bg-purple-500 text-white"
            >
              {savingNote ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Salvar Nota"
              )}
            </Button>
          </div>
        </form>
      )}

      {formMode === "BOOKMARK" && (
        <form
          onSubmit={handleCreateBookmark}
          className="p-3 bg-neutral-900/90 border-b border-neutral-800 space-y-2.5 shrink-0"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-neutral-300">
              Marcar Página no Material
            </span>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-neutral-400">Pág:</label>
              <input
                type="number"
                min="1"
                max="999"
                value={newBookmarkPage}
                onChange={(e) => setNewBookmarkPage(Number(e.target.value))}
                required
                className="w-14 h-6 text-xs font-mono bg-neutral-950 border border-neutral-750 rounded px-1.5 text-center text-neutral-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 text-[10px]">
            {(["BOOKMARK", "IMPORTANT", "EXAM", "QUESTION"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setNewBookmarkType(t)}
                className={`py-1 rounded border text-center font-medium transition-colors ${
                  newBookmarkType === t
                    ? BOOKMARK_TYPE_CONFIG[t].color + " ring-1 ring-white/20"
                    : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {BOOKMARK_TYPE_CONFIG[t].label}
              </button>
            ))}
          </div>

          <Input
            value={newBookmarkTitle}
            onChange={(e) => setNewBookmarkTitle(e.target.value)}
            placeholder="Ex: Equação da Continuidade / Exercício 4"
            className="h-7 text-xs bg-neutral-950 border-neutral-750"
            required
            autoFocus
          />

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFormMode("NONE")}
              className="h-6 text-xs text-neutral-400"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={savingBookmark || !newBookmarkTitle.trim()}
              className="h-6 text-xs bg-purple-600 hover:bg-purple-500 text-white"
            >
              {savingBookmark ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Salvar Marcador"
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {loading ? (
          <div className="text-center py-8 text-neutral-500">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-1.5 text-purple-400" />
            <span className="text-xs">Carregando anotações...</span>
          </div>
        ) : (
          <>
            {/* Bookmarks Section */}
            {showBookmarks && bookmarks.length > 0 && (
              <div className="space-y-1.5 pb-2">
                <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-1">
                  Marcadores ({bookmarks.length})
                </div>
                {bookmarks.map((b) => (
                  <BookmarkCard
                    key={b.id}
                    bookmark={b}
                    subjectId={subjectId}
                    onNavigateToPage={onNavigateToPage}
                    onDeleted={(id) =>
                      setBookmarks((prev) => prev.filter((item) => item.id !== id))
                    }
                  />
                ))}
              </div>
            )}

            {/* Notes Section */}
            {filteredNotes.length > 0 && (
              <div className="space-y-2">
                {activeTab === "ALL" && bookmarks.length > 0 && (
                  <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-1 pt-1">
                    Anotações ({filteredNotes.length})
                  </div>
                )}
                {filteredNotes.map((n) => (
                  <NoteCard
                    key={n.id}
                    note={n}
                    subjectId={subjectId}
                    onNavigateToPage={onNavigateToPage}
                    onDeleted={(id) =>
                      setNotes((prev) => prev.filter((item) => item.id !== id))
                    }
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {filteredNotes.length === 0 && (!showBookmarks || bookmarks.length === 0) && (
              <div className="text-center py-12 px-4 space-y-2">
                <FileText className="h-8 w-8 text-neutral-700 mx-auto" />
                <p className="text-xs font-medium text-neutral-300">
                  Nenhum registro nesta categoria
                </p>
                <p className="text-[11px] text-neutral-500">
                  Clique em <strong>Nova Nota</strong> para anotar dúvidas, fórmulas e pontos importantes da aula.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
