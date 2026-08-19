"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  X,
  PanelRightClose,
  PanelRightOpen,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  UploadCloud,
  Loader2,
} from "lucide-react";
import { StudyPanel } from "./study-panel";
import { getPdfBlobUrl, storePdfFile } from "@/lib/pdf-storage";
import { TopicNoteItem } from "./note-card";
import { MaterialBookmarkItem } from "./bookmark-card";

interface StudyWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: string;
  topicTitle: string;
  subjectId?: string;
  materialId?: string | null;
  pdfUrl?: string | null;
  fileName?: string;
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
  initialNotes = [],
  initialBookmarks = [],
}: StudyWorkspaceModalProps) {
  const [zoom, setZoom] = React.useState<number>(100);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [inputPage, setInputPage] = React.useState<string>("1");
  const [isPanelOpen, setIsPanelOpen] = React.useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);

  const [activeUrl, setActiveUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [isMissing, setIsMissing] = React.useState<boolean>(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Load PDF from IndexedDB or URL on open
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

  // Navigate to specific page in PDF viewer
  const handleNavigateToPage = (pageNumber: number) => {
    if (pageNumber < 1) return;
    setCurrentPage(pageNumber);
    setInputPage(pageNumber.toString());
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(inputPage);
    if (!isNaN(parsed) && parsed >= 1) {
      setCurrentPage(parsed);
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

  if (!open) return null;

  const pdfViewerSource = activeUrl
    ? `${activeUrl}#page=${currentPage}&toolbar=1&navpanes=1`
    : null;

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
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800 bg-neutral-900/90 shrink-0">
            {/* Title & Badge */}
            <div className="flex items-center gap-2.5 min-w-0 pr-4">
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
            </div>

            {/* Viewer Controls */}
            <div className="flex items-center gap-2 shrink-0">
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

                  <button
                    type="button"
                    onClick={() => handleNavigateToPage(currentPage + 1)}
                    className="p-1 text-neutral-400 hover:text-white"
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
                    onClick={() => setZoom((z) => Math.max(50, z - 15))}
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
                    onClick={() => setZoom((z) => Math.min(200, z + 15))}
                    className="p-1 hover:text-white disabled:opacity-30"
                    title="Aumentar Zoom"
                    disabled={zoom >= 200}
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Toggle Study Panel Button */}
              <Button
                variant={isPanelOpen ? "default" : "outline"}
                size="sm"
                onClick={() => setIsPanelOpen((p) => !p)}
                className={`h-8 text-xs gap-1.5 ${
                  isPanelOpen
                    ? "bg-purple-600 hover:bg-purple-500 text-white"
                    : "border-neutral-750 text-neutral-300"
                }`}
                title={isPanelOpen ? "Recolher painel de estudo" : "Abrir painel de estudo"}
              >
                {isPanelOpen ? (
                  <PanelRightClose className="h-3.5 w-3.5" />
                ) : (
                  <PanelRightOpen className="h-3.5 w-3.5" />
                )}
                <span className="hidden md:inline">Painel de Estudo</span>
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

          {/* Main Area: Side-by-side (PDF on left + Study Panel on right) */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left: PDF Document Area */}
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
              ) : pdfViewerSource ? (
                <div
                  className="w-full h-full transition-all flex items-center justify-center"
                  style={{
                    transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
                    transformOrigin: "top center",
                  }}
                >
                  <iframe
                    key={`pdf-frame-${currentPage}`}
                    src={pdfViewerSource}
                    className="w-full h-full rounded-md border border-neutral-800 bg-white shadow-inner"
                    title={topicTitle}
                  />
                </div>
              ) : null}
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
                  initialNotes={initialNotes}
                  initialBookmarks={initialBookmarks}
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
