"use client";

import * as React from "react";
import {
  Dialog,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  X,
  UploadCloud,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { getPdfBlobUrl, storePdfFile } from "@/lib/pdf-storage";

interface PdfViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  materialId?: string | null;
  topicId?: string | null;
  pdfUrl?: string | null;
  fileName?: string;
  onFileReuploaded?: (file: File) => void;
}

export function PdfViewerModal({
  open,
  onOpenChange,
  title,
  materialId,
  topicId,
  pdfUrl,
  fileName,
  onFileReuploaded,
}: PdfViewerModalProps) {
  const [zoom, setZoom] = React.useState<number>(100);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [activeUrl, setActiveUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [isMissing, setIsMissing] = React.useState<boolean>(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    async function resolvePdfUrl() {
      if (!open) return;
      setLoading(true);
      setIsMissing(false);
      setZoom(100);
      setIsFullscreen(false);

      try {
        // 1. Try to load from IndexedDB using materialId
        if (materialId) {
          const storedUrl = await getPdfBlobUrl(materialId);
          if (storedUrl) {
            setActiveUrl(storedUrl);
            setLoading(false);
            return;
          }
        }

        // 2. Try to load from IndexedDB using topicId
        if (topicId) {
          const storedUrl = await getPdfBlobUrl(topicId);
          if (storedUrl) {
            setActiveUrl(storedUrl);
            setLoading(false);
            return;
          }
        }

        // 3. Fallback to passed URL if not an expired blob
        if (pdfUrl && !pdfUrl.startsWith("blob:")) {
          setActiveUrl(pdfUrl);
          setLoading(false);
          return;
        }

        if (pdfUrl && pdfUrl.startsWith("blob:")) {
          // Check if the current in-memory blob is still reachable
          try {
            const res = await fetch(pdfUrl);
            if (res.ok) {
              setActiveUrl(pdfUrl);
              setLoading(false);
              return;
            }
          } catch {
            // Blob is expired from a previous page session
          }
        }

        // PDF not found in local browser storage
        setIsMissing(true);
      } catch {
        setIsMissing(true);
      } finally {
        setLoading(false);
      }
    }

    resolvePdfUrl();
  }, [open, materialId, topicId, pdfUrl]);

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
        onFileReuploaded?.(file);
      } catch {
        // Error handling
      } finally {
        setLoading(false);
      }
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 transition-all ${
          isFullscreen ? "p-0" : ""
        }`}
      >
        <div
          className={`flex flex-col bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl transition-all ${
            isFullscreen
              ? "w-screen h-screen rounded-none border-none"
              : "w-full max-w-5xl h-[88vh]"
          }`}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/90 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0 pr-4">
              <div className="p-1.5 rounded-md bg-purple-950/60 border border-purple-800 text-purple-400 shrink-0">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-neutral-100 truncate">
                  {title}
                </h3>
                {fileName && (
                  <p className="text-[11px] text-neutral-400 truncate font-mono">
                    {fileName}
                  </p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              {activeUrl && !isMissing && (
                <>
                  {/* Zoom Buttons */}
                  <div className="flex items-center rounded-md bg-neutral-950 border border-neutral-800 p-0.5 text-xs text-neutral-300">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(50, z - 15))}
                      className="p-1 hover:text-white disabled:opacity-30"
                      title="Diminuir Zoom"
                      disabled={zoom <= 50}
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-2 font-mono text-[11px] min-w-[42px] text-center">
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

                  {/* Fullscreen Toggle */}
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

                  {/* Download */}
                  <a
                    href={activeUrl}
                    download={fileName || "material-aula.pdf"}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                    title="Baixar arquivo"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </>
              )}

              {/* Close */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0 text-neutral-400 hover:text-red-400"
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 bg-neutral-900/50 overflow-auto flex items-center justify-center p-2 relative">
            {loading ? (
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 text-purple-400 animate-spin mx-auto" />
                <p className="text-xs text-neutral-300">Carregando slide da aula...</p>
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
                    Arquivo pronto para ser sincronizado
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    O PDF {fileName ? <strong className="text-neutral-200">{fileName}</strong> : "desta aula"} precisa ser carregado para leitura local neste navegador.
                  </p>
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs bg-purple-600 hover:bg-purple-500 text-white"
                >
                  <UploadCloud className="h-3.5 w-3.5 mr-1.5" />
                  Selecionar {fileName || "PDF"} para Leitura
                </Button>
              </div>
            ) : activeUrl ? (
              <div
                className="w-full h-full transition-all flex items-center justify-center"
                style={{
                  transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
                  transformOrigin: "top center",
                }}
              >
                <iframe
                  src={`${activeUrl}#toolbar=1&navpanes=1`}
                  className="w-full h-full rounded-md border border-neutral-800 bg-white shadow-inner"
                  title={title}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
