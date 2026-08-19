"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  X,
  PanelRightClose,
  PanelRightOpen,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  UploadCloud,
  Loader2,
  PenLine,
  LayoutGrid,
  FileText,
} from "lucide-react";
import { StudyPanel } from "./study-panel";
import { AnnotationToolbar, AnnotationTool } from "./annotation-toolbar";
import { AnnotationLayer, AnnotationData } from "./annotation-layer";
import { PdfPinsLayer, PinCreationType } from "./pdf-pins-layer";
import { PdfCanvasRenderer } from "./pdf-canvas-renderer";
import { StudyBoardCanvas } from "./study-board-canvas";
import { getPdfBlobUrl, storePdfFile } from "@/lib/pdf-storage";
import { TopicNoteItem } from "./note-card";
import { MaterialBookmarkItem } from "./bookmark-card";
import {
  getPdfAnnotationsAction,
  createPdfAnnotationAction,
  deletePdfAnnotationAction,
} from "@/actions/pdf-annotation.actions";
import {
  getAnchoredNotesAction,
  createAnchoredNoteAction,
} from "@/actions/pdf-note-anchor.actions";
import {
  getTopicBoardAction,
  addPdfRegionToBoardAction,
} from "@/actions/study-board.actions";
import { AnchoredTopicNoteItem } from "@/services/pdf-note-anchor.service";
import { StudyBoardData } from "@/services/study-board.service";
import { useToast } from "@/components/ui/toast";

interface StudyWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: string;
  topicTitle: string;
  subjectId?: string;
  materialId?: string | null;
  pdfUrl?: string | null;
  fileName?: string;
  initialMode?: "PDF" | "BOARD";
  initialNotes?: TopicNoteItem[];
  initialBookmarks?: MaterialBookmarkItem[];
}

export function StudyWorkspaceModal({
  open,
  onOpenChange,
  topicId,
  topicTitle,
  subjectId,
  materialId,
  pdfUrl,
  fileName,
  initialMode = "PDF",
  initialNotes = [],
  initialBookmarks = [],
}: StudyWorkspaceModalProps) {
  const { toast } = useToast();

  // Mode Switcher: "PDF" or "BOARD"
  const [workspaceMode, setWorkspaceMode] = React.useState<"PDF" | "BOARD">(initialMode);

  // Navigation & View state
  const [zoom, setZoom] = React.useState<number>(100);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [totalPages, setTotalPages] = React.useState<number>(1);
  const [inputPage, setInputPage] = React.useState<string>("1");
  const [isPanelOpen, setIsPanelOpen] = React.useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);

  const [activeUrl, setActiveUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [isMissing, setIsMissing] = React.useState<boolean>(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // --- ANNOTATIONS STATE (FASE B1) ---
  const [isAnnotationMode, setIsAnnotationMode] = React.useState<boolean>(false);
  const [activeTool, setActiveTool] = React.useState<AnnotationTool>("PEN");
  const [color, setColor] = React.useState<string>("#eab308");
  const [strokeWidth, setStrokeWidth] = React.useState<number>(4);
  const [isAnnotationVisible, setIsAnnotationVisible] = React.useState<boolean>(true);
  const [annotations, setAnnotations] = React.useState<AnnotationData[]>([]);
  const [isSavingAnnotation, setIsSavingAnnotation] = React.useState<boolean>(false);
  const [lastSavedAnnotation, setLastSavedAnnotation] = React.useState<Date | null>(null);

  // --- PINS & ANCHORED NOTES STATE (FASE B2) ---
  const [anchoredNotes, setAnchoredNotes] = React.useState<AnchoredTopicNoteItem[]>([]);
  const [selectedNoteId, setSelectedNoteId] = React.useState<string | null>(null);

  // --- STUDY BOARD STATE (FASE C1) ---
  const [boardData, setBoardData] = React.useState<StudyBoardData | null>(null);

  // Undo / Redo History Stack for current page session
  const [history, setHistory] = React.useState<AnnotationData[][]>([]);
  const [historyIndex, setHistoryIndex] = React.useState<number>(-1);

  // 1. Load PDF from IndexedDB or URL on open
  React.useEffect(() => {
    async function resolvePdfUrl() {
      if (!open) return;
      setLoading(true);
      setIsMissing(false);
      setZoom(100);
      setCurrentPage(1);
      setInputPage("1");

      try {
        if (materialId) {
          const storedUrl = await getPdfBlobUrl(materialId);
          if (storedUrl) {
            setActiveUrl(storedUrl);
            setLoading(false);
            return;
          }
        }

        if (topicId) {
          const storedUrl = await getPdfBlobUrl(topicId);
          if (storedUrl) {
            setActiveUrl(storedUrl);
            setLoading(false);
            return;
          }
        }

        if (pdfUrl && !pdfUrl.startsWith("blob:")) {
          setActiveUrl(pdfUrl);
          setLoading(false);
          return;
        }

        if (pdfUrl && pdfUrl.startsWith("blob:")) {
          try {
            const res = await fetch(pdfUrl);
            if (res.ok) {
              setActiveUrl(pdfUrl);
              setLoading(false);
              return;
            }
          } catch {
            // Blob expired
          }
        }

        setIsMissing(true);
      } catch {
        setIsMissing(true);
      } finally {
        setLoading(false);
      }
    }

    resolvePdfUrl();
  }, [open, materialId, topicId, pdfUrl]);

  // 2. Fetch page annotations from DB whenever topicId or currentPage changes
  React.useEffect(() => {
    async function loadPageAnnotations() {
      if (!open || !topicId || currentPage < 1) return;
      try {
        const res = await getPdfAnnotationsAction(topicId, currentPage);
        if (res.success && res.data) {
          const loaded = res.data.map((a: any) => ({
            id: a.id,
            type: a.type,
            pageNumber: a.pageNumber,
            data: a.data,
          }));
          setAnnotations(loaded);
          setHistory([loaded]);
          setHistoryIndex(0);
        }
      } catch {
        // Continue silently
      }
    }

    loadPageAnnotations();
  }, [open, topicId, currentPage]);

  // 3. Fetch anchored notes from DB for topic
  const loadAnchoredNotes = React.useCallback(async () => {
    if (!open || !topicId) return;
    try {
      const res = await getAnchoredNotesAction(topicId);
      if (res.success && res.data) {
        setAnchoredNotes(res.data as AnchoredTopicNoteItem[]);
      }
    } catch {
      // Continue silently
    }
  }, [open, topicId]);

  React.useEffect(() => {
    loadAnchoredNotes();
  }, [loadAnchoredNotes]);

  // 4. Fetch Study Board data for topic
  const loadBoardData = React.useCallback(async () => {
    if (!open || !topicId) return;
    try {
      const res = await getTopicBoardAction(topicId);
      if (res.success && res.data) {
        setBoardData(res.data as StudyBoardData);
      }
    } catch {
      // Continue silently
    }
  }, [open, topicId]);

  React.useEffect(() => {
    loadBoardData();
  }, [loadBoardData]);

  // Page Navigator Handlers
  const handleNavigateToPage = (pageNumber: number) => {
    if (pageNumber < 1 || (totalPages > 1 && pageNumber > totalPages)) return;
    setCurrentPage(pageNumber);
    setInputPage(pageNumber.toString());
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(inputPage);
    if (!isNaN(parsed) && parsed >= 1 && (totalPages <= 1 || parsed <= totalPages)) {
      setCurrentPage(parsed);
    } else {
      setInputPage(currentPage.toString());
    }
  };

  const handleManualReupload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setLoading(true);
      try {
        if (materialId) await storePdfFile(materialId, file);
        if (topicId) await storePdfFile(topicId, file);

        const newUrl = URL.createObjectURL(file);
        setActiveUrl(newUrl);
        setIsMissing(false);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
  };

  // --- ANNOTATION ACTIONS & HISTORY ---
  const handleAddAnnotation = async (newAnn: Omit<AnnotationData, "id">) => {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const annotationWithId: AnnotationData = {
      ...newAnn,
      id: tempId,
      pageNumber: currentPage,
    };

    const nextAnnotations = [...annotations, annotationWithId];
    setAnnotations(nextAnnotations);

    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(nextAnnotations);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);

    setIsSavingAnnotation(true);
    try {
      const res = await createPdfAnnotationAction(
        {
          topicId,
          materialId: materialId || null,
          pageNumber: currentPage,
          type: newAnn.type,
          data: newAnn.data,
        },
        subjectId
      );

      if (res.success && res.data) {
        setLastSavedAnnotation(new Date());
        setAnnotations((prev) =>
          prev.map((a) => (a.id === tempId ? { ...a, id: (res.data as any).id } : a))
        );
      }
    } catch {
      // Silently fail on autosave
    } finally {
      setIsSavingAnnotation(false);
    }
  };

  const handleDeleteAnnotation = async (id: string) => {
    const nextAnnotations = annotations.filter((a) => a.id !== id);
    setAnnotations(nextAnnotations);

    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(nextAnnotations);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);

    if (!id.startsWith("temp-")) {
      setIsSavingAnnotation(true);
      try {
        await deletePdfAnnotationAction(id, subjectId);
        setLastSavedAnnotation(new Date());
      } catch {
        // Silently fail
      } finally {
        setIsSavingAnnotation(false);
      }
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setAnnotations(history[prevIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setAnnotations(history[nextIndex]);
    }
  };

  // --- ANCHORED NOTES (PINS & REGIONS) HANDLERS ---
  const handleCreateAnchoredNote = async (data: {
    type: PinCreationType;
    content: string;
    anchorType: "POINT" | "REGION";
    anchorData: {
      x: number;
      y: number;
      width?: number;
      height?: number;
    };
  }) => {
    try {
      const res = await createAnchoredNoteAction(
        {
          topicId,
          materialId: materialId || null,
          pageNumber: currentPage,
          type: data.type,
          content: data.content,
          anchorType: data.anchorType,
          anchorData: data.anchorData,
        },
        subjectId
      );

      if (res.success && res.data) {
        toast(data.anchorType === "REGION" ? "Trecho registrado!" : "Pin fixado no slide!");
        await loadAnchoredNotes();
        setSelectedNoteId((res.data as any).id);
        setIsPanelOpen(true);
      } else {
        toast(res.error || "Erro ao salvar comentário.", "error");
      }
    } catch {
      toast("Erro ao fixar marcador no PDF.", "error");
    }
  };

  // Add Region to Study Board
  const handleAddRegionToBoard = async (data: {
    bounding: { x: number; y: number; width: number; height: number };
    pageNumber: number;
    title?: string;
    anchorId?: string | null;
  }) => {
    try {
      const res = await addPdfRegionToBoardAction(
        {
          topicId,
          materialId: materialId || null,
          pageNumber: data.pageNumber,
          anchorId: data.anchorId || null,
          bounding: data.bounding,
          title: data.title || `Trecho da Pág. ${data.pageNumber}`,
        },
        subjectId
      );

      if (res.success) {
        toast("Trecho adicionado à Lousa!");
        await loadBoardData();
      } else {
        toast(res.error || "Erro ao enviar trecho para a lousa.", "error");
      }
    } catch {
      toast("Erro ao adicionar à lousa.", "error");
    }
  };

  // Bidirectional Selection: From PDF to StudyPanel
  const handleSelectNoteFromPdf = (noteId: string) => {
    setSelectedNoteId(noteId);
    setIsPanelOpen(true);
  };

  // Bidirectional Selection: From StudyPanel to PDF
  const handleSelectNoteFromPanel = (noteId: string, pageNumber?: number | null) => {
    setSelectedNoteId(noteId);
    if (workspaceMode === "BOARD") {
      setWorkspaceMode("PDF");
    }
    if (pageNumber && pageNumber !== currentPage) {
      handleNavigateToPage(pageNumber);
    }
  };

  // Bidirectional Navigation: From Board back to PDF page & anchor
  const handleOpenRegionInPdf = (pageNumber: number, anchorId?: string | null) => {
    setWorkspaceMode("PDF");
    handleNavigateToPage(pageNumber);
    if (anchorId) {
      const matching = anchoredNotes.find((n) => n.anchor?.id === anchorId);
      if (matching) {
        setSelectedNoteId(matching.id);
      }
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-1 sm:p-3 transition-all ${
          isFullscreen ? "p-0" : ""
        }`}
      >
        <div
          className={`flex flex-col bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl transition-all ${
            isFullscreen
              ? "w-screen h-screen rounded-none border-none"
              : "w-full max-w-[96vw] h-[94vh]"
          }`}
        >
          {/* Top Navbar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-neutral-900/90 shrink-0">
            {/* Left: Title & Mode Switcher */}
            <div className="flex items-center gap-3 min-w-0 pr-4">
              <div className="p-1.5 rounded-md bg-purple-950/70 border border-purple-800 text-purple-400 shrink-0">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-neutral-100 truncate">
                    {topicTitle}
                  </h3>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 text-purple-300 border border-purple-800/80">
                    Workspace de Estudo
                  </span>
                </div>
                {fileName && (
                  <p className="text-[11px] text-neutral-400 truncate font-mono">
                    {fileName}
                  </p>
                )}
              </div>

              {/* Workspace View Switcher (PDF ↔ Lousa) */}
              <div className="flex items-center bg-neutral-950 border border-neutral-800 p-0.5 rounded-lg text-xs ml-2">
                <button
                  type="button"
                  data-testid="workspace-mode-pdf"
                  onClick={() => setWorkspaceMode("PDF")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                    workspaceMode === "PDF"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  data-testid="workspace-mode-board"
                  onClick={() => {
                    setWorkspaceMode("BOARD");
                    loadBoardData();
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all font-medium ${
                    workspaceMode === "BOARD"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Lousa</span>
                  {boardData && boardData.items.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-purple-950 border border-purple-700 text-purple-200">
                      {boardData.items.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Controls & Annotation Button */}
            <div className="flex items-center gap-2 shrink-0">
              {/* PDF Mode Controls */}
              {workspaceMode === "PDF" && (
                <>
                  {/* Annotation Mode Toggle Button */}
                  {activeUrl && !isMissing && (
                    <Button
                      size="sm"
                      variant={isAnnotationMode ? "default" : "outline"}
                      onClick={() => setIsAnnotationMode((prev) => !prev)}
                      className={`h-8 text-xs gap-1.5 font-medium transition-all ${
                        isAnnotationMode
                          ? "bg-purple-600 hover:bg-purple-500 text-white shadow-md ring-1 ring-purple-400"
                          : "border-purple-800/60 text-purple-300 hover:bg-purple-950/40"
                      }`}
                      title="Ativar ferramentas de anotação e desenho"
                    >
                      <PenLine className="h-3.5 w-3.5" />
                      <span>Anotar</span>
                    </Button>
                  )}

                  {/* Page Navigator */}
                  {activeUrl && !isMissing && (
                    <form
                      onSubmit={handlePageInputSubmit}
                      className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-md px-1.5 py-0.5 text-xs text-neutral-300"
                    >
                      <button
                        type="button"
                        onClick={() => handleNavigateToPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage <= 1}
                        className="p-1 text-neutral-400 hover:text-white disabled:opacity-30"
                        title="Página anterior"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </button>

                      <span className="text-[10px] text-neutral-400">Pág:</span>
                      <input
                        type="text"
                        value={inputPage}
                        onChange={(e) => setInputPage(e.target.value)}
                        onBlur={handlePageInputSubmit}
                        className="w-8 h-5 text-xs font-mono text-center bg-neutral-900 border border-neutral-750 rounded text-neutral-100 focus:outline-none focus:border-purple-500"
                      />
                      {totalPages > 1 && (
                        <span className="text-[10px] text-neutral-500 font-mono">
                          / {totalPages}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleNavigateToPage(currentPage + 1)}
                        disabled={totalPages > 1 && currentPage >= totalPages}
                        className="p-1 text-neutral-400 hover:text-white disabled:opacity-30"
                        title="Próxima página"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </form>
                  )}

                  {/* Zoom Controls */}
                  {activeUrl && !isMissing && (
                    <div className="hidden sm:flex items-center rounded-md bg-neutral-950 border border-neutral-800 p-0.5 text-xs text-neutral-300">
                      <button
                        type="button"
                        onClick={() => setZoom((z) => Math.max(50, z - 25))}
                        className="p-1 hover:text-white disabled:opacity-30"
                        title="Diminuir Zoom"
                        disabled={zoom <= 50}
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-2 font-mono text-[11px] min-w-[40px] text-center">
                        {zoom}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setZoom((z) => Math.min(200, z + 25))}
                        className="p-1 hover:text-white disabled:opacity-30"
                        title="Aumentar Zoom"
                        disabled={zoom >= 200}
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Toggle Study Panel */}
              <Button
                variant={isPanelOpen ? "default" : "outline"}
                size="sm"
                onClick={() => setIsPanelOpen((p) => !p)}
                className={`h-8 text-xs gap-1.5 ${
                  isPanelOpen
                    ? "bg-neutral-800 hover:bg-neutral-700 text-white"
                    : "border-neutral-750 text-neutral-300"
                }`}
                title={isPanelOpen ? "Recolher painel de estudo" : "Abrir painel de estudo"}
              >
                {isPanelOpen ? (
                  <PanelRightClose className="h-3.5 w-3.5" />
                ) : (
                  <PanelRightOpen className="h-3.5 w-3.5" />
                )}
                <span className="hidden md:inline">Painel</span>
              </Button>

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen((f) => !f)}
                className="h-8 w-8 p-0 text-neutral-400 hover:text-white"
                title={isFullscreen ? "Restaurar tamanho" : "Tela cheia"}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>

              {/* Close */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0 text-neutral-400 hover:text-red-400"
                title="Fechar workspace"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Main Area: Side-by-side (PDF or Board on left + Study Panel on right) */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Left 1: PDF Document Viewport Area */}
            <div className={workspaceMode === "PDF" ? "flex-1 flex overflow-hidden relative min-w-0" : "hidden"}>
              {/* Floating Annotation Toolbar */}
              {isAnnotationMode && activeUrl && !isMissing && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40">
                  <AnnotationToolbar
                    activeTool={activeTool}
                    onSelectTool={setActiveTool}
                    color={color}
                    onChangeColor={setColor}
                    strokeWidth={strokeWidth}
                    onChangeStrokeWidth={setStrokeWidth}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    isVisible={isAnnotationVisible}
                    onToggleVisibility={() => setIsAnnotationVisible((v) => !v)}
                    isSaving={isSavingAnnotation}
                    lastSavedAt={lastSavedAnnotation}
                  />
                </div>
              )}

              {/* PDF Document Canvas Area */}
              <div className="flex-1 bg-neutral-900/40 overflow-auto flex items-center justify-center p-2 relative min-w-0">
                {loading ? (
                  <div className="text-center space-y-2">
                    <Loader2 className="h-8 w-8 text-purple-400 animate-spin mx-auto" />
                    <p className="text-xs text-neutral-300">Carregando slide do capítulo...</p>
                  </div>
                ) : isMissing ? (
                  <div className="text-center space-y-4 max-w-md p-6 bg-neutral-950/80 rounded-xl border border-neutral-800">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      onChange={handleManualReupload}
                      className="hidden"
                    />

                    <div className="h-12 w-12 rounded-full bg-purple-950/60 border border-purple-800 text-purple-400 flex items-center justify-center mx-auto">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-100">
                        Sincronizar Material da Aula
                      </h4>
                      <p className="text-xs text-neutral-400 mt-1">
                        O arquivo {fileName ? <strong className="text-neutral-200">{fileName}</strong> : "desta aula"} precisa ser sincronizado para leitura no navegador.
                      </p>
                    </div>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs bg-purple-600 hover:bg-purple-500 text-white"
                    >
                      <UploadCloud className="h-3.5 w-3.5 mr-1.5" />
                      Selecionar PDF
                    </Button>
                  </div>
                ) : activeUrl ? (
                  <PdfCanvasRenderer
                    pdfUrl={activeUrl}
                    pageNumber={currentPage}
                    zoom={zoom}
                    onLoadSuccess={(pages) => setTotalPages(pages)}
                  >
                    {({ width, height }) => (
                      <>
                        {/* Graphical Drawings Layer (Fase B1) */}
                        <AnnotationLayer
                          pageWidth={width}
                          pageHeight={height}
                          pageNumber={currentPage}
                          activeTool={
                            isAnnotationMode && activeTool !== "PIN" && activeTool !== "REGION"
                              ? activeTool
                              : "SELECT"
                          }
                          color={color}
                          strokeWidth={strokeWidth}
                          annotations={annotations}
                          isVisible={isAnnotationVisible}
                          onAddAnnotation={handleAddAnnotation}
                          onUpdateAnnotation={() => {}}
                          onDeleteAnnotation={handleDeleteAnnotation}
                        />

                        {/* Pins and Regions Semantic Layer (Fase B2) */}
                        <PdfPinsLayer
                          pageWidth={width}
                          pageHeight={height}
                          pageNumber={currentPage}
                          anchoredNotes={anchoredNotes}
                          selectedNoteId={selectedNoteId}
                          activeTool={isAnnotationMode ? activeTool : "SELECT"}
                          onSelectNote={handleSelectNoteFromPdf}
                          onCreateAnchoredNote={handleCreateAnchoredNote}
                          onAddToBoard={handleAddRegionToBoard}
                        />
                      </>
                    )}
                  </PdfCanvasRenderer>
                ) : null}
              </div>
            </div>

            {/* Left 2: Study Board Canvas Area (Fase C1) */}
            <div className={workspaceMode === "BOARD" ? "flex-1 relative min-w-0" : "hidden"}>
              {boardData ? (
                <StudyBoardCanvas
                  boardId={boardData.id}
                  topicId={topicId}
                  subjectId={subjectId}
                  pdfUrl={activeUrl}
                  initialItems={boardData.items}
                  onItemsChange={(items) => setBoardData((prev) => prev ? { ...prev, items } : null)}
                  onOpenInPdf={handleOpenRegionInPdf}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-neutral-400">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-400 mr-2" />
                  <span className="text-xs">Carregando Lousa de estudo...</span>
                </div>
              )}
            </div>

            {/* Right: Collapsible Study Panel */}
            {isPanelOpen && (
              <div className="w-full sm:w-[380px] md:w-[420px] shrink-0 h-full">
                <StudyPanel
                  topicId={topicId}
                  topicTitle={topicTitle}
                  materialId={materialId}
                  subjectId={subjectId}
                  currentPageNumber={currentPage}
                  selectedNoteId={selectedNoteId}
                  initialNotes={initialNotes}
                  initialBookmarks={initialBookmarks}
                  onSelectNote={handleSelectNoteFromPanel}
                  onNavigateToPage={handleNavigateToPage}
                  onCollapse={() => setIsPanelOpen(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
