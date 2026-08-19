"use client";

import * as React from "react";
import { Upload, Trash2, Loader2, Calendar, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ExerciseSetItem } from "@/domain/exercises";
import { createExerciseSetAction, updateExerciseSetAction } from "@/actions/exercise.actions";
import { storeLocalFile, fileToDataUrl } from "@/lib/file-storage";

interface ExerciseSetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  setToEdit?: ExerciseSetItem | null;
  assessmentsList?: { id: string; title: string; date?: string | null }[];
  onSuccess?: () => void;
}

export function ExerciseSetModal({
  open,
  onOpenChange,
  subjectId,
  setToEdit,
  assessmentsList = [],
  onSuccess,
}: ExerciseSetModalProps) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [assessmentId, setAssessmentId] = React.useState<string>("");
  const [dueDate, setDueDate] = React.useState<string>("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [currentFileName, setCurrentFileName] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (open) {
      if (setToEdit) {
        setTitle(setToEdit.title);
        setDescription(setToEdit.description || "");
        setAssessmentId(setToEdit.assessmentId || "");
        setDueDate(setToEdit.dueDate || "");
        setCurrentFileName(setToEdit.sourceFileName || "");
        setSelectedFile(null);
      } else {
        setTitle("");
        setDescription("");
        setAssessmentId("");
        setDueDate("");
        setCurrentFileName("");
        setSelectedFile(null);
      }
      setLoading(false);
    }
  }, [open, setToEdit]);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setCurrentFileName(file.name);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setCurrentFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast("O título da lista é obrigatório.", "error");
      return;
    }

    setLoading(true);
    try {
      let sourceFileName = currentFileName || null;
      let sourceFileUrl = setToEdit?.sourceFileUrl || null;
      let sourceFileType = setToEdit?.sourceFileType || "PDF";

      if (selectedFile) {
        sourceFileName = selectedFile.name;
        sourceFileType = selectedFile.type.includes("pdf") ? "PDF" : "IMAGE";
        const fileId = `set_file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        try {
          sourceFileUrl = await storeLocalFile(fileId, selectedFile);
        } catch {
          sourceFileUrl = await fileToDataUrl(selectedFile);
        }
      }

      if (setToEdit) {
        const res = await updateExerciseSetAction(setToEdit.id, subjectId, {
          title: title.trim(),
          description: description.trim() || null,
          assessmentId: assessmentId || null,
          dueDate: dueDate || null,
          sourceFileName,
          sourceFileUrl,
          sourceFileType,
        });

        if (res.success) {
          toast("Lista de exercícios atualizada!");
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast(res.error || "Erro ao atualizar lista.", "error");
        }
      } else {
        const res = await createExerciseSetAction({
          subjectId,
          title: title.trim(),
          description: description.trim() || null,
          assessmentId: assessmentId || null,
          dueDate: dueDate || null,
          sourceFileName,
          sourceFileUrl,
          sourceFileType,
        });

        if (res.success) {
          toast("Lista de exercícios criada com sucesso!");
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast(res.error || "Erro ao criar lista.", "error");
        }
      }
    } catch {
      toast("Erro ao salvar lista de exercícios.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-100">
            {setToEdit ? "Editar Lista de Exercícios" : "Nova Lista de Exercícios"}
          </h3>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-neutral-400 hover:text-white p-1 rounded-md"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Title */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Nome / Título da Lista *
            </label>
            <Input
              placeholder="Ex: Lista para P1, Lista 01 - Estática dos Fluidos"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-neutral-950 border-neutral-800 text-neutral-100 text-xs h-9"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Descrição / Instruções (opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Fazer os exercícios pares para fixação..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-md p-2 text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-purple-500 resize-none text-xs"
            />
          </div>

          {/* Assessment Link & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
                <Award className="h-3 w-3 text-neutral-400" />
                Avaliação Relacionada
              </label>
              <select
                value={assessmentId}
                onChange={(e) => setAssessmentId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-2.5 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
              >
                <option value="">Nenhuma avaliação</option>
                {assessmentsList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title} {a.date ? `(${a.date})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-neutral-400" />
                Prazo / Data de Entrega
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-neutral-950 border-neutral-800 text-neutral-100 text-xs h-9"
              />
            </div>
          </div>

          {/* Original File Upload (PDF/Image) */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1.5 flex items-center gap-1">
              <Upload className="h-3 w-3 text-neutral-400" />
              Arquivo Original do Professor (PDF ou Imagem)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp,image/jpg"
              onChange={handleFileSelected}
              className="hidden"
            />

            {currentFileName ? (
              <div className="flex items-center justify-between p-2.5 bg-neutral-950 rounded-lg border border-neutral-800">
                <span className="text-xs text-neutral-200 truncate max-w-xs">
                  📄 {currentFileName}
                </span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-neutral-500 hover:text-red-400 p-1"
                  title="Remover arquivo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-neutral-800 rounded-lg p-3 text-center cursor-pointer hover:border-purple-500/50 transition-colors bg-neutral-950/40"
              >
                <p className="text-neutral-400 text-xs">
                  Clique para anexar o PDF da lista (ex: Lista-P1.pdf)
                </p>
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-neutral-400 hover:text-white text-xs h-9"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs h-9 px-4"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Salvando...
                </>
              ) : setToEdit ? (
                "Atualizar Lista"
              ) : (
                "Criar Lista"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
