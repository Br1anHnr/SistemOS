"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2, Crop, Loader2 } from "lucide-react";
import { getDocumentProxy } from "unpdf";
import { getPdfBlobUrl } from "@/lib/pdf-storage";

interface PdfRegionCardProps {
  id: string;
  data: {
    materialId?: string | null;
    pageNumber: number;
    anchorId?: string | null;
    bounding: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    title?: string;
  };
  pdfUrl?: string | null;
  width: number;
  height: number;
  onOpenInPdf: (pageNumber: number, anchorId?: string | null) => void;
  onDelete: () => void;
}

export function PdfRegionCard({
  id,
  data,
  pdfUrl,
  width,
  height,
  onOpenInPdf,
  onDelete,
}: PdfRegionCardProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    async function renderCroppedRegion() {
      setLoading(true);
      try {
        let activeUrl = pdfUrl;
        if (!activeUrl && data.materialId) {
          activeUrl = await getPdfBlobUrl(data.materialId);
        }

        if (!activeUrl) {
          setLoading(false);
          return;
        }

        const res = await fetch(activeUrl);
        const buffer = await res.arrayBuffer();
        const pdf = await getDocumentProxy(new Uint8Array(buffer));
        if (!isMounted) return;

        const page = await pdf.getPage(Math.min(Math.max(1, data.pageNumber), pdf.numPages));
        if (!isMounted) return;

        // Render full page offscreen
        const scale = 2.0; // High quality crop
        const viewport = page.getViewport({ scale });

        const offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = viewport.width;
        offscreenCanvas.height = viewport.height;
        const offscreenContext = offscreenCanvas.getContext("2d");

        if (!offscreenContext) return;

        await page.render({
          canvasContext: offscreenContext,
          viewport,
          canvas: offscreenCanvas,
        } as any).promise;

        if (!isMounted || !canvasRef.current) return;

        // Crop the bounding box onto the card canvas
        const targetCanvas = canvasRef.current;
        const b = data.bounding;

        const cropX = b.x * viewport.width;
        const cropY = b.y * viewport.height;
        const cropW = Math.max(1, b.width * viewport.width);
        const cropH = Math.max(1, b.height * viewport.height);

        targetCanvas.width = cropW;
        targetCanvas.height = cropH;

        const targetCtx = targetCanvas.getContext("2d");
        if (targetCtx) {
          targetCtx.drawImage(
            offscreenCanvas,
            cropX,
            cropY,
            cropW,
            cropH,
            0,
            0,
            cropW,
            cropH
          );
        }
      } catch {
        // Handle error silently
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    renderCroppedRegion();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl, data.materialId, data.pageNumber, data.bounding]);

  return (
    <div className="flex flex-col w-full h-full bg-neutral-900/90 border border-indigo-500/60 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md select-none group">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-neutral-950/80 border-b border-neutral-800 text-xs shrink-0">
        <div className="flex items-center gap-1.5 min-w-0 pr-2">
          <Crop className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span className="font-semibold text-[11px] text-neutral-200 truncate">
            {data.title || `Trecho da Pág. ${data.pageNumber}`}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onOpenInPdf(data.pageNumber, data.anchorId)}
            className="h-6 px-1.5 text-[10px] text-indigo-300 hover:text-white hover:bg-indigo-950/50"
            title="Abrir no slide original do PDF"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Abrir no PDF
          </Button>

          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
            title="Remover da Lousa"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Cropped Canvas Body */}
      <div className="flex-1 bg-white flex items-center justify-center overflow-hidden p-1 relative">
        {loading && (
          <div className="absolute inset-0 bg-neutral-950/60 flex items-center justify-center z-10">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain rounded-sm"
        />
      </div>
    </div>
  );
}
