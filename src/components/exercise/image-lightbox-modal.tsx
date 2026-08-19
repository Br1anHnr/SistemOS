"use client";

import * as React from "react";
import { X, ZoomIn, ZoomOut, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageLightboxModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  caption?: string | null;
  originalName?: string | null;
}

export function ImageLightboxModal({
  open,
  onOpenChange,
  imageUrl,
  caption,
  originalName,
}: ImageLightboxModalProps) {
  const [zoom, setZoom] = React.useState<number>(100);

  React.useEffect(() => {
    if (open) {
      setZoom(100);
    }
  }, [open, imageUrl]);

  if (!open || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-150">
      {/* Top Header Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="text-sm font-medium text-neutral-200 truncate max-w-md">
          {caption || originalName || "Visualizar Imagem"}
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-neutral-900/80 border border-neutral-800 rounded-lg p-1 text-neutral-300">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(50, z - 25))}
              className="p-1 hover:text-white disabled:opacity-40"
              disabled={zoom <= 50}
              title="Diminuir zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs font-mono">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(250, z + 25))}
              className="p-1 hover:text-white disabled:opacity-40"
              disabled={zoom >= 250}
              title="Aumentar zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Download */}
          <a
            href={imageUrl}
            download={originalName || "imagem-resolucao.png"}
            className="p-2 rounded-lg bg-neutral-900/80 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
            title="Baixar imagem"
          >
            <Download className="h-4 w-4" />
          </a>

          {/* Close */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-9 w-9 p-0 text-neutral-400 hover:text-white bg-neutral-900/80 hover:bg-neutral-800"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Image Container with Pan / Zoom */}
      <div className="w-full h-full flex items-center justify-center overflow-auto p-8">
        <img
          src={imageUrl}
          alt={caption || "Imagem ampliada"}
          className="max-h-[85vh] max-w-[90vw] object-contain rounded-md shadow-2xl transition-transform duration-100 select-none"
          style={{ transform: `scale(${zoom / 100})` }}
        />
      </div>

      {/* Bottom Caption */}
      {caption && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-xl text-center bg-neutral-900/90 border border-neutral-800 px-4 py-2 rounded-lg text-xs text-neutral-300 shadow-xl">
          {caption}
        </div>
      )}
    </div>
  );
}
