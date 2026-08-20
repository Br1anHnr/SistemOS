"use client";

import * as React from "react";
import {
  ListOrdered,
  BookOpen,
  Calendar,
  Sparkles,
  Plus,
  Crosshair,
  FileText,
  Upload,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Eye,
  Camera,
  Image as ImageIcon,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  ExerciseSetItem,
  ExerciseItem,
  calculateExerciseSetProgress,
} from "@/domain/exercises";
import {
  getExerciseSetByIdAction,
  getExercisesAction,
  createExerciseAction,
  addExerciseSourceRegionAction,
  updateExerciseSetAction,
} from "@/actions/exercise.actions";
import { PdfCanvasRenderer, PdfFitMode } from "@/components/study-workspace/pdf-canvas-renderer";
import { ExerciseMappingLayer } from "./exercise-mapping-layer";
import { ExerciseCard } from "./exercise-card";
import { ExerciseModal } from "./exercise-modal";
import { ExerciseDetailModal } from "./exercise-detail-modal";
import { AttemptRegisterModal } from "./attempt-register-modal";
import { getLocalFileUrl, storeLocalFile, fileToDataUrl } from "@/lib/file-storage";

interface ExerciseSetWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setId: string | null;
  subjectId: string;
  subjectName?: string;
  topicsList?: { id: string; title: string }[];
  onSuccess?: () => void;
}

export function ExerciseSetWorkspaceModal({
  open,
  onOpenChange,
  setId,
  subjectId,
  subjectName = "Disciplina",
  topicsList = [],
  onSuccess,
}: ExerciseSetWorkspaceModalProps) {
  const { toast } = useToast();

  const [set, setSet] = React.useState<ExerciseSetItem | null>(null);
  const [exercises, setExercises] = React.useState<ExerciseItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Document Viewer State
  const [resolvedFileUrl, setResolvedFileUrl] = React.useState<string | null>(null);
  const [pageNumber, setPageNumber] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [zoom, setZoom] = React.useState(100);
  const [fitMode, setFitMode] = React.useState<PdfFitMode>("PAGE");

  const viewerContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [containerDimensions, setContainerDimensions] = React.useState<{ width: number; height: number }>({
    width: 800,
    height: 600,
  });

  // Mapping Mode State
  const [isMappingMode, setIsMappingMode] = React.useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = React.useState<string | null>(null);

  // Secondary Modals State
  const [manualModalOpen, setManualModalOpen] = React.useState(false);
  const [detailModalExerciseId, setDetailModalExerciseId] = React.useState<string | null>(null);
  const [attemptModalExercise, setAttemptModalExercise] = React.useState<ExerciseItem | null>(null);

  // Direct Image/File Upload Ref
  const fileUploadInputRef = React.useRef<HTMLInputElement | null>(null);
  const questionImageInputRef = React.useRef<HTMLInputElement | null>(null);

  // Calculate Next Suggested Question Reference (e.g. Q01, Q02, Q03...)
  const suggestedNextRef = React.useMemo(() => {
    const count = exercises.length + 1;
    return `Q${count < 10 ? `0${count}` : count}`;
  }, [exercises.length]);

  // Load Data
  const loadData = React.useCallback(async () => {
    if (!open || !setId) return;
    setLoading(true);
    try {
      const [setRes, exRes] = await Promise.all([
        getExerciseSetByIdAction(setId, subjectId),
        getExercisesAction(subjectId, { exerciseSetId: setId }),
      ]);

      if (setRes.success && setRes.data) {
        setSet(setRes.data as ExerciseSetItem);
        if (setRes.data.sourceFileUrl) {
          const resolved = await getLocalFileUrl(setRes.data.sourceFileUrl);
          setResolvedFileUrl(resolved);
        } else {
          setResolvedFileUrl(null);
        }
      }

      if (exRes.success && exRes.data) {
        setExercises(exRes.data as ExerciseItem[]);
      }
    } catch {
      toast("Erro ao carregar dados do workspace da lista.", "error");
    } finally {
      setLoading(false);
    }
  }, [open, setId, subjectId, toast]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Measure Viewer Container
  React.useEffect(() => {
    if (!viewerContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(viewerContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Keyboard navigation for pages
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        setPageNumber((p) => Math.max(1, p - 1));
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        setPageNumber((p) => Math.min(totalPages, p + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, totalPages]);

  // Handle Uploading Document to this Set
  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !setId) return;

    try {
      const fileId = `set_doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      let filePath = "";
      try {
        filePath = await storeLocalFile(fileId, file);
      } catch {
        filePath = await fileToDataUrl(file);
      }

      const res = await updateExerciseSetAction(setId, subjectId, {
        sourceFileName: file.name,
        sourceFileUrl: filePath,
        sourceFileType: file.type.includes("pdf") ? "PDF" : "IMAGE",
      });

      if (res.success) {
        toast("Documento da lista anexado!");
        await loadData();
        onSuccess?.();
      } else {
        toast(res.error || "Erro ao salvar arquivo.", "error");
      }
    } catch {
      toast("Erro ao carregar arquivo.", "error");
    }
  };

  // Handle Quick Question Creation from Region Mapping
  const handleConfirmNewExercise = async (data: {
    referenceNumber: string;
    topicId?: string | null;
    region: {
      x: number;
      y: number;
      width: number;
      height: number;
      pageNumber: number;
    };
  }) => {
    if (!setId) return;
    try {
      const derivedTitle = `Questão ${data.referenceNumber}`;

      const res = await createExerciseAction({
        subjectId,
        exerciseSetId: setId,
        topicId: data.topicId || null,
        title: derivedTitle,
        referenceNumber: data.referenceNumber,
        sourceRegions: [
          {
            pageNumber: data.region.pageNumber,
            x: data.region.x,
            y: data.region.y,
            width: data.region.width,
            height: data.region.height,
            orderIndex: 0,
          },
        ],
      });

      if (res.success && res.data) {
        toast(`Questão ${data.referenceNumber} mapeada com sucesso!`);
        setSelectedExerciseId(res.data.id);
        await loadData();
        onSuccess?.();
      } else {
        toast(res.error || "Erro ao criar questão.", "error");
      }
    } catch {
      toast("Erro ao mapear questão.", "error");
    }
  };

  // Handle Adding an Additional Region to an Existing Question
  const handleAddRegionToExercise = async (
    exerciseId: string,
    region: {
      x: number;
      y: number;
      width: number;
      height: number;
      pageNumber: number;
    }
  ) => {
    try {
      const targetEx = exercises.find((e) => e.id === exerciseId);
      const nextIndex = targetEx?.sourceRegions?.length || 0;

      const res = await addExerciseSourceRegionAction(
        {
          exerciseId,
          pageNumber: region.pageNumber,
          x: region.x,
          y: region.y,
          width: region.width,
          height: region.height,
          orderIndex: nextIndex,
        },
        subjectId
      );

      if (res.success) {
        toast(`Trecho adicional anexado à ${targetEx?.referenceNumber || "questão"}!`);
        setSelectedExerciseId(exerciseId);
        await loadData();
        onSuccess?.();
      } else {
        toast(res.error || "Erro ao anexar trecho.", "error");
      }
    } catch {
      toast("Erro ao anexar trecho à questão.", "error");
    }
  };

  // Handle Selecting a Question from index
  const handleSelectQuestion = (ex: ExerciseItem) => {
    setSelectedExerciseId(ex.id);
    if (ex.sourceRegions && ex.sourceRegions.length > 0) {
      const targetPage = ex.sourceRegions[0].pageNumber;
      setPageNumber(targetPage);
    }
  };

  // Check if document is an image format
  const isImageDocument =
    set?.sourceFileType === "IMAGE" ||
    (resolvedFileUrl && /\.(png|jpe?g|webp|gif|bmp)(\?.*)?$/i.test(resolvedFileUrl)) ||
    (resolvedFileUrl && resolvedFileUrl.startsWith("data:image/"));

  const progress = calculateExerciseSetProgress(exercises);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-150">
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full h-[95vh] shadow-2xl overflow-hidden flex flex-col">
          {/* Top Bar Header */}
          <div className="p-3.5 px-5 border-b border-neutral-800 bg-neutral-900/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
            {/* Title, Subject & Assessment Info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-purple-950/70 border border-purple-800/80 flex items-center justify-center shrink-0">
                <ListOrdered className="h-4 w-4 text-purple-400" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-neutral-100 truncate">
                    {set?.title || "Workspace da Lista"}
                  </h2>

                  {set?.assessmentTitle && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950 border border-purple-800 text-purple-300">
                      <Calendar className="h-2.5 w-2.5" />
                      {set.assessmentTitle}
                      {set.assessmentDate ? ` • ${new Date(set.assessmentDate).toLocaleDateString("pt-BR")}` : ""}
                    </span>
                  )}
                </div>

                <p className="text-xs text-neutral-400 truncate">
                  {subjectName} {set?.dueDate ? `• Entrega: ${new Date(set.dueDate).toLocaleDateString("pt-BR")}` : ""}
                </p>
              </div>
            </div>

            {/* Right Header: Progress Bar & Close */}
            <div className="flex items-center gap-4 shrink-0">
              {/* Progress Summary */}
              <div className="flex flex-col items-end text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-neutral-200">
                    {progress.resolvedCount}/{progress.total} resolvidas
                  </span>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    ({progress.progressPercentage}%)
                  </span>
                </div>

                {/* Micro Progress Bar */}
                <div className="w-36 bg-neutral-800 rounded-full h-1.5 overflow-hidden flex mt-1">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{
                      width: `${progress.total > 0 ? (progress.resolvedCount / progress.total) * 100 : 0}%`,
                    }}
                  />
                  <div
                    className="bg-amber-500 h-full transition-all"
                    style={{
                      width: `${progress.total > 0 ? (progress.partialCount / progress.total) * 100 : 0}%`,
                    }}
                  />
                  <div
                    className="bg-purple-500 h-full transition-all"
                    style={{
                      width: `${progress.total > 0 ? (progress.reviewCount / progress.total) * 100 : 0}%`,
                    }}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all"
                    style={{
                      width: `${progress.total > 0 ? (progress.wrongCount / progress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
                title="Fechar Workspace"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Main Body Split: Document Viewer (Left/Center) + Questions Panel (Right) */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* 1. DOCUMENT VIEWER AREA */}
            <div className="flex-1 flex flex-col bg-neutral-950 overflow-hidden relative border-r border-neutral-850">
              {/* Document Toolbar */}
              {resolvedFileUrl && (
                <div className="p-2 px-4 bg-neutral-900/60 border-b border-neutral-850 flex items-center justify-between gap-2 shrink-0 text-xs">
                  {/* Page Navigation */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pageNumber <= 1}
                      onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                      className="h-7 w-7 p-0 text-neutral-300"
                      title="Página Anterior (Seta Esquerda)"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-300 px-1">
                      <span>Pág.</span>
                      <Input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={pageNumber}
                        onChange={(e) => {
                          const p = parseInt(e.target.value, 10);
                          if (!isNaN(p)) setPageNumber(Math.min(totalPages, Math.max(1, p)));
                        }}
                        className="h-6 w-10 text-center text-[11px] p-0 font-mono bg-neutral-950 border-neutral-800 text-neutral-100"
                      />
                      <span>/ {totalPages}</span>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pageNumber >= totalPages}
                      onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
                      className="h-7 w-7 p-0 text-neutral-300"
                      title="Próxima Página (Seta Direita)"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setFitMode("CUSTOM");
                        setZoom((z) => Math.max(50, z - 15));
                      }}
                      className="h-7 w-7 p-0 text-neutral-400 hover:text-white"
                      title="Reduzir Zoom"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </Button>

                    <span className="text-[10px] font-mono text-neutral-400 w-10 text-center">
                      {zoom}%
                    </span>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setFitMode("CUSTOM");
                        setZoom((z) => Math.min(250, z + 15));
                      }}
                      className="h-7 w-7 p-0 text-neutral-400 hover:text-white"
                      title="Aumentar Zoom"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setFitMode(fitMode === "PAGE" ? "WIDTH" : "PAGE");
                        setZoom(100);
                      }}
                      className="h-7 px-2 text-[11px] text-neutral-300 gap-1 ml-1"
                      title="Ajustar à Página / Largura"
                    >
                      <Maximize2 className="h-3 w-3" />
                      {fitMode === "PAGE" ? "Ajustar Largura" : "Ajustar Página"}
                    </Button>
                  </div>

                  {/* Mapping Mode Toggle Button */}
                  <div>
                    <Button
                      size="sm"
                      onClick={() => setIsMappingMode((prev) => !prev)}
                      className={`h-7 text-xs font-semibold gap-1.5 transition-all shadow-sm ${
                        isMappingMode
                          ? "bg-purple-600 hover:bg-purple-500 text-white ring-2 ring-purple-400 shadow-purple-900/50"
                          : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                      }`}
                    >
                      <Crosshair className="h-3.5 w-3.5" />
                      {isMappingMode ? "Mapeando (Arraste no PDF)" : "Mapear Questões"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Main Document Canvas Viewport */}
              <div
                ref={viewerContainerRef}
                className="flex-1 overflow-auto flex items-center justify-center p-4 relative"
              >
                {!resolvedFileUrl ? (
                  /* Dropzone to Upload List Document */
                  <div className="p-12 text-center bg-neutral-900/40 border border-dashed border-neutral-800 rounded-2xl max-w-md space-y-4">
                    <div className="h-12 w-12 rounded-2xl bg-purple-950/70 border border-purple-800 flex items-center justify-center mx-auto text-purple-400">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-200">
                        Nenhum documento anexado à lista
                      </h4>
                      <p className="text-xs text-neutral-400 mt-1">
                        Anexe o PDF ou imagem da lista do professor para mapear as questões diretamente.
                      </p>
                    </div>
                    <input
                      ref={fileUploadInputRef}
                      type="file"
                      accept="application/pdf,image/png,image/jpeg,image/webp"
                      onChange={handleUploadDocument}
                      className="hidden"
                    />
                    <Button
                      size="sm"
                      onClick={() => fileUploadInputRef.current?.click()}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-xs gap-1.5 font-medium"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Fazer Upload da Lista (PDF ou Imagem)
                    </Button>
                  </div>
                ) : isImageDocument ? (
                  /* High-Res Image Document View */
                  <div className="relative inline-block max-w-full shadow-2xl rounded overflow-hidden">
                    <img
                      src={resolvedFileUrl}
                      alt="Lista de Exercícios"
                      className="max-h-[80vh] w-auto block object-contain select-none"
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        setTotalPages(1);
                      }}
                    />
                    <ExerciseMappingLayer
                      pageWidth={containerDimensions.width}
                      pageHeight={containerDimensions.height}
                      pageNumber={1}
                      isMappingMode={isMappingMode}
                      exercises={exercises}
                      selectedExerciseId={selectedExerciseId}
                      suggestedReference={suggestedNextRef}
                      topicsList={topicsList}
                      onConfirmNewExercise={handleConfirmNewExercise}
                      onSelectExercise={handleSelectQuestion}
                      onAddRegionToExercise={handleAddRegionToExercise}
                    />
                  </div>
                ) : (
                  /* High-Res PDF Document View with unpdf & ExerciseMappingLayer */
                  <PdfCanvasRenderer
                    pdfUrl={resolvedFileUrl}
                    pageNumber={pageNumber}
                    zoom={zoom}
                    fitMode={fitMode}
                    containerWidth={containerDimensions.width}
                    containerHeight={containerDimensions.height}
                    onLoadSuccess={(total) => setTotalPages(total)}
                  >
                    {({ width, height }) => (
                      <ExerciseMappingLayer
                        pageWidth={width}
                        pageHeight={height}
                        pageNumber={pageNumber}
                        isMappingMode={isMappingMode}
                        exercises={exercises}
                        selectedExerciseId={selectedExerciseId}
                        suggestedReference={suggestedNextRef}
                        topicsList={topicsList}
                        onConfirmNewExercise={handleConfirmNewExercise}
                        onSelectExercise={handleSelectQuestion}
                        onAddRegionToExercise={handleAddRegionToExercise}
                      />
                    )}
                  </PdfCanvasRenderer>
                )}
              </div>
            </div>

            {/* 2. QUESTIONS PANEL / ÍNDICE DA LISTA (Right Side) */}
            <div className="w-full md:w-80 lg:w-96 flex flex-col bg-neutral-900/40 shrink-0 overflow-hidden">
              {/* Panel Header & Quick Action Buttons */}
              <div className="p-3.5 border-b border-neutral-850 bg-neutral-950/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                    Questões da Lista ({exercises.length})
                  </h3>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setManualModalOpen(true)}
                    className="h-6 text-[11px] border-neutral-800 hover:border-purple-600 text-neutral-300 hover:text-white gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    + Manual
                  </Button>
                </div>

                {/* Primary Mapping Bar */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setIsMappingMode((prev) => !prev)}
                    className={`flex-1 h-8 text-xs font-semibold gap-1.5 shadow-sm ${
                      isMappingMode
                        ? "bg-purple-600 hover:bg-purple-500 text-white ring-1 ring-purple-400"
                        : "bg-neutral-850 hover:bg-neutral-800 text-purple-300 border border-purple-900/60"
                    }`}
                  >
                    <Crosshair className="h-3.5 w-3.5 text-purple-400" />
                    {isMappingMode ? "Mapeamento Ativo (Q01, Q02...)" : "+ Mapear no PDF"}
                  </Button>
                </div>
              </div>

              {/* Questions List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
                {loading ? (
                  <div className="py-12 text-center text-neutral-500 text-xs">
                    Carregando questões...
                  </div>
                ) : exercises.length === 0 ? (
                  <div className="p-8 text-center bg-neutral-950/40 rounded-xl border border-neutral-850 space-y-3">
                    <p className="text-neutral-400 text-xs">
                      Nenhuma questão mapeada nesta lista.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setIsMappingMode(true)}
                      className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium gap-1"
                    >
                      <Crosshair className="h-3 w-3" />
                      Começar a Mapear no PDF
                    </Button>
                  </div>
                ) : (
                  exercises.map((ex) => (
                    <ExerciseCard
                      key={ex.id}
                      exercise={ex}
                      sourceFileUrl={set?.sourceFileUrl}
                      onOpenDetail={(item) => {
                        handleSelectQuestion(item);
                        setDetailModalExerciseId(item.id);
                      }}
                      onNewAttempt={(item) => setAttemptModalExercise(item)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal 1: Manual Exercise Creation Modal */}
      <ExerciseModal
        open={manualModalOpen}
        onOpenChange={setManualModalOpen}
        subjectId={subjectId}
        defaultExerciseSetId={setId}
        topicsList={topicsList}
        onSuccess={async () => {
          await loadData();
          onSuccess?.();
        }}
      />

      {/* Modal 2: Exercise Detail & Attempt View Modal */}
      {detailModalExerciseId && (
        <ExerciseDetailModal
          open={!!detailModalExerciseId}
          onOpenChange={(open) => !open && setDetailModalExerciseId(null)}
          exerciseId={detailModalExerciseId}
          subjectId={subjectId}
          sourceFileUrl={set?.sourceFileUrl}
          onSuccess={async () => {
            await loadData();
            onSuccess?.();
          }}
        />
      )}

      {/* Modal 3: Direct Attempt Register Modal */}
      {attemptModalExercise && (
        <AttemptRegisterModal
          open={!!attemptModalExercise}
          onOpenChange={(open) => !open && setAttemptModalExercise(null)}
          exerciseId={attemptModalExercise.id}
          exerciseTitle={attemptModalExercise.title}
          subjectId={subjectId}
          onSuccess={async () => {
            await loadData();
            onSuccess?.();
          }}
        />
      )}
    </>
  );
}
