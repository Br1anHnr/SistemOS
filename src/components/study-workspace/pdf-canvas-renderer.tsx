"use client";

import * as React from "react";
import { getDocumentProxy } from "unpdf";
import { Loader2, AlertCircle } from "lucide-react";

interface PdfCanvasRendererProps {
  pdfUrl: string;
  pageNumber: number;
  zoom: number; // e.g. 100 for 100%, 150 for 150%
  onLoadSuccess?: (totalPages: number, width: number, height: number) => void;
  children?: (dimensions: { width: number; height: number }) => React.ReactNode;
}

export function PdfCanvasRenderer({
  pdfUrl,
  pageNumber,
  zoom,
  onLoadSuccess,
  children,
}: PdfCanvasRendererProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dimensions, setDimensions] = React.useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const pdfDocRef = React.useRef<any>(null);
  const renderTaskRef = React.useRef<any>(null);

  // 1. Fetch and load PDF document
  React.useEffect(() => {
    let isMounted = true;
    async function loadPdf() {
      if (!pdfUrl) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(pdfUrl);
        if (!res.ok) throw new Error("Falha ao obter arquivo PDF.");
        const buffer = await res.arrayBuffer();

        const pdf = await getDocumentProxy(new Uint8Array(buffer));
        if (!isMounted) return;

        pdfDocRef.current = pdf;
        const totalPages = pdf.numPages;

        // Load first page dimensions
        const page = await pdf.getPage(Math.min(Math.max(1, pageNumber), totalPages));
        const viewport = page.getViewport({ scale: 1.0 });

        onLoadSuccess?.(totalPages, viewport.width, viewport.height);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || "Erro ao renderizar PDF.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl]);

  // 2. Render active page on canvas when pageNumber or zoom changes
  React.useEffect(() => {
    let isMounted = true;

    async function renderPage() {
      if (!pdfDocRef.current || !canvasRef.current) return;
      setLoading(true);

      try {
        // Cancel previous render task if active
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // Ignore cancel error
          }
        }

        const pdf = pdfDocRef.current;
        const page = await pdf.getPage(Math.min(Math.max(1, pageNumber), pdf.numPages));
        if (!isMounted) return;

        // Base resolution scaling (scale 1.5 * zoom factor for crisp text on Retina/High-DPI)
        const scale = 1.35 * (zoom / 100);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        setDimensions({ width: viewport.width, height: viewport.height });

        const renderContext = {
          canvasContext: context,
          viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          // Ignore cancelled renders
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    renderPage();

    return () => {
      isMounted = false;
    };
  }, [pageNumber, zoom, pdfDocRef.current]);

  return (
    <div className="relative flex flex-col items-center justify-center min-w-fit min-h-fit py-4">
      {/* Loading Overlay */}
      {loading && dimensions.width === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-neutral-400">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
          <span className="text-xs">Renderizando slide da aula...</span>
        </div>
      )}

      {/* Error View */}
      {error && (
        <div className="flex flex-col items-center justify-center p-8 text-rose-400 bg-rose-950/20 border border-rose-900/40 rounded-lg">
          <AlertCircle className="h-6 w-6 mb-2" />
          <span className="text-xs">{error}</span>
        </div>
      )}

      {/* Canvas & Overlay Wrapper */}
      <div
        className={`relative shadow-2xl rounded-sm border border-neutral-700 bg-white transition-opacity ${
          loading && dimensions.width === 0 ? "opacity-0" : "opacity-100"
        }`}
        style={{
          width: dimensions.width || "auto",
          height: dimensions.height || "auto",
        }}
      >
        <canvas ref={canvasRef} className="block w-full h-full select-none" />

        {/* Dynamic Annotation Overlay Layer */}
        {children && dimensions.width > 0 && dimensions.height > 0 && (
          <div className="absolute inset-0 w-full h-full pointer-events-auto">
            {children(dimensions)}
          </div>
        )}
      </div>
    </div>
  );
}
