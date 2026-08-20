"use client";

import * as React from "react";
import { getDocumentProxy } from "unpdf";
import { Loader2 } from "lucide-react";
import { ExerciseSourceRegionItem } from "@/domain/exercises";
import { getLocalFileUrl } from "@/lib/file-storage";

interface ExerciseSourceRegionSnippetProps {
  region: {
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    materialId?: string | null;
  };
  fileUrl?: string | null;
  className?: string;
  maxHeight?: number;
  onClick?: () => void;
}

export function ExerciseSourceRegionSnippet({
  region,
  fileUrl,
  className = "",
  maxHeight,
  onClick,
}: ExerciseSourceRegionSnippetProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    async function renderSnippet() {
      if (!fileUrl) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(false);

      try {
        const resolvedUrl = await getLocalFileUrl(fileUrl);
        const isImage = /\.(png|jpe?g|webp|gif|bmp)(\?.*)?$/i.test(resolvedUrl) || resolvedUrl.startsWith("data:image/");

        if (isImage) {
          // Render crop from image
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = resolvedUrl;
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Erro ao carregar imagem"));
          });

          if (!isMounted || !canvasRef.current) return;

          const naturalW = img.naturalWidth || img.width;
          const naturalH = img.naturalHeight || img.height;

          const cropX = region.x * naturalW;
          const cropY = region.y * naturalH;
          const cropW = Math.max(10, region.width * naturalW);
          const cropH = Math.max(10, region.height * naturalH);

          const canvas = canvasRef.current;
          canvas.width = cropW;
          canvas.height = cropH;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
          }
        } else {
          // Render crop from PDF using unpdf
          const res = await fetch(resolvedUrl);
          if (!res.ok) throw new Error("Erro ao buscar PDF");
          const buffer = await res.arrayBuffer();

          const pdf = await getDocumentProxy(new Uint8Array(buffer));
          if (!isMounted) return;

          const page = await pdf.getPage(Math.min(Math.max(1, region.pageNumber), pdf.numPages));
          if (!isMounted) return;

          // High quality offscreen render (scale 2.0)
          const scale = 2.0;
          const viewport = page.getViewport({ scale });

          const offscreenCanvas = document.createElement("canvas");
          offscreenCanvas.width = viewport.width;
          offscreenCanvas.height = viewport.height;
          const offscreenCtx = offscreenCanvas.getContext("2d");

          if (!offscreenCtx) throw new Error("Contexto canvas indisponível");

          await page.render({
            canvasContext: offscreenCtx,
            viewport,
            canvas: offscreenCanvas,
          } as any).promise;

          if (!isMounted || !canvasRef.current) return;

          const cropX = region.x * viewport.width;
          const cropY = region.y * viewport.height;
          const cropW = Math.max(10, region.width * viewport.width);
          const cropH = Math.max(10, region.height * viewport.height);

          const targetCanvas = canvasRef.current;
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
        }
      } catch (err) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    renderSnippet();

    return () => {
      isMounted = false;
    };
  }, [fileUrl, region.pageNumber, region.x, region.y, region.width, region.height]);

  return (
    <div
      onClick={onClick}
      style={maxHeight ? { maxHeight: `${maxHeight}px` } : undefined}
      className={`relative overflow-hidden rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center ${className} ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/80 z-10">
          <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
        </div>
      )}

      {error ? (
        <div className="p-3 text-center text-[10px] text-neutral-500 italic">
          Prévia indisponível
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="w-full h-auto object-contain max-h-full block"
        />
      )}
    </div>
  );
}
