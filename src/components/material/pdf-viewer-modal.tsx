"use client";

import * as React from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface PdfViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  pdfUrl: string | null;
  fileName?: string;
}

export function PdfViewerModal({
  open,
  onOpenChange,
  title,
  pdfUrl,
  fileName,
}: PdfViewerModalProps) {
  const [zoom, setZoom] = React.useState<number>(100);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    setZoom(100);
    setIsFullscreen(false);
  }, [open]);

  if (!pdfUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 transition-all ${
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
                  <p className="text-[11px] text-neutral-400 truncate">
                    {fileName}
                  </p>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
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
                href={pdfUrl}
                download={fileName || "material-aula.pdf"}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Baixar arquivo"
              >
                <Download className="h-4 w-4" />
              </a>

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

          {/* PDF Viewer Body */}
          <div className="flex-1 bg-neutral-900/50 overflow-auto flex items-center justify-center p-2">
            <div
              className="w-full h-full transition-all flex items-center justify-center"
              style={{
                transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
                transformOrigin: "top center",
              }}
            >
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=1`}
                className="w-full h-full rounded-md border border-neutral-800 bg-white"
                title={title}
              />
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
