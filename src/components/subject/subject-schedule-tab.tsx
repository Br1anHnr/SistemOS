"use client";

import * as React from "react";
import { Plus, Clock, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import { ScheduleModal } from "@/components/subject/schedule-modal";
import { formatScheduleSlot, DAYS_OF_WEEK } from "@/lib/date-utils";
import { deleteScheduleAction } from "@/actions/schedule.actions";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

export interface ScheduleItem {
  id: string;
  subjectId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
}

export function SubjectScheduleTab({
  subjectId,
  schedules,
}: {
  subjectId: string;
  schedules: ScheduleItem[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja remover este horário de aula?")) return;
    setDeletingId(id);
    try {
      const res = await deleteScheduleAction(id, subjectId);
      if (res.success) {
        toast("Horário removido com sucesso!");
        router.refresh();
      } else {
        toast(res.error || "Erro ao remover horário.", "error");
      }
    } catch {
      toast("Erro ao remover horário.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100">Grade de Aulas</h3>
          <p className="text-xs text-neutral-400">
            Horários semanais cadastrados para esta disciplina.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Adicionar Horário
        </Button>
      </div>

      {schedules.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Nenhum horário cadastrado"
          description="Adicione os dias da semana e horários em que você tem aula desta matéria."
          actionLabel="Adicionar Horário"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {schedules.map((sch) => (
            <Card
              key={sch.id}
              className="border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900/70 transition-colors"
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-medium text-sm text-neutral-100">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <span>{DAYS_OF_WEEK[sch.dayOfWeek] || `Dia ${sch.dayOfWeek}`}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-300">
                    <Clock className="h-3 w-3 text-neutral-500" />
                    <span>{formatScheduleSlot(sch.dayOfWeek, sch.startTime, sch.endTime, true).split(" • ")[1]}</span>
                  </div>
                  {sch.room && (
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <MapPin className="h-3 w-3 text-neutral-500" />
                      <span>{sch.room}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(sch.id)}
                  disabled={deletingId === sch.id}
                  className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
                  title="Excluir horário"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ScheduleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        subjectId={subjectId}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
