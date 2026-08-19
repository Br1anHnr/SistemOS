"use client";

import * as React from "react";
import { Plus, Calendar, Check, Trash2, Edit2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { SemesterModal } from "@/components/semester/semester-modal";
import { setActiveSemesterAction, deleteSemesterAction } from "@/actions/semester.actions";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

export interface SemesterItem {
  id: string;
  name: string;
  academicYear: string;
  academicTerm: string;
  startDate: string;
  endDate: string;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  createdAt: Date;
  updatedAt: Date;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "success" | "secondary" | "outline" | "warning" }
> = {
  ACTIVE: { label: "Ativo", variant: "success" },
  PLANNED: { label: "Planejado", variant: "info" as any },
  COMPLETED: { label: "Concluído", variant: "secondary" },
  ARCHIVED: { label: "Arquivado", variant: "outline" },
};

export function SemesterList({
  initialSemesters,
}: {
  initialSemesters: SemesterItem[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingSemester, setEditingSemester] = React.useState<SemesterItem | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  const handleSetActive = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await setActiveSemesterAction(id);
      if (res.success) {
        toast("Semestre definido como ativo!");
        router.refresh();
      } else {
        toast(res.error || "Erro ao ativar semestre.", "error");
      }
    } catch {
      toast("Erro ao ativar semestre.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o semestre "${name}"? Todas as disciplinas vinculadas também serão excluídas.`)) {
      return;
    }
    setActionLoading(id);
    try {
      const res = await deleteSemesterAction(id);
      if (res.success) {
        toast("Semestre excluído com sucesso!");
        router.refresh();
      } else {
        toast(res.error || "Erro ao excluir semestre.", "error");
      }
    } catch {
      toast("Erro ao excluir semestre.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  if (initialSemesters.length === 0) {
    return (
      <>
        <EmptyState
          icon={Calendar}
          title="Nenhum semestre cadastrado"
          description="Crie seu primeiro período acadêmico para começar a estruturar sua grade de matérias."
          actionLabel="Criar Semestre"
          onAction={() => {
            setEditingSemester(null);
            setModalOpen(true);
          }}
        />
        <SemesterModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          semesterToEdit={editingSemester}
          onSuccess={() => router.refresh()}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => {
            setEditingSemester(null);
            setModalOpen(true);
          }}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Novo Semestre
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {initialSemesters.map((sem) => {
          const statusInfo = STATUS_CONFIG[sem.status] || {
            label: sem.status,
            variant: "secondary" as const,
          };
          const isActive = sem.status === "ACTIVE";

          return (
            <Card
              key={sem.id}
              className={`transition-all duration-200 ${
                isActive
                  ? "border-emerald-800/60 bg-emerald-950/15 ring-1 ring-emerald-800/40"
                  : "hover:border-neutral-700"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{sem.name}</CardTitle>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </div>
                    <CardDescription>
                      {sem.academicTerm} • {sem.academicYear}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingSemester(sem);
                        setModalOpen(true);
                      }}
                      className="p-1.5 rounded text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(sem.id, sem.name)}
                      className="p-1.5 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 text-xs space-y-3">
                <div className="flex items-center text-neutral-400 gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {new Date(sem.startDate).toLocaleDateString("pt-BR")} até{" "}
                    {new Date(sem.endDate).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                  {!isActive ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-neutral-750 text-neutral-300 hover:text-white"
                      disabled={actionLoading === sem.id}
                      onClick={() => handleSetActive(sem.id)}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Definir como Ativo
                    </Button>
                  ) : (
                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Semestre Atual em Execução
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <SemesterModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        semesterToEdit={editingSemester}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
