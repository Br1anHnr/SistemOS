"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createScheduleAction } from "@/actions/schedule.actions";
import { Loader2 } from "lucide-react";
import { DAYS_OF_WEEK } from "@/lib/date-utils";

interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  onSuccess?: () => void;
}

export function ScheduleModal({
  open,
  onOpenChange,
  subjectId,
  onSuccess,
}: ScheduleModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [dayOfWeek, setDayOfWeek] = React.useState<number>(1); // Monday default
  const [startTime, setStartTime] = React.useState("19:00");
  const [endTime, setEndTime] = React.useState("20:40");
  const [room, setRoom] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setDayOfWeek(1);
      setStartTime("19:00");
      setEndTime("20:40");
      setRoom("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await createScheduleAction({
        subjectId,
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        room: room || null,
      });

      if (!res.success) {
        setError(res.error || "Erro ao adicionar horário.");
        return;
      }

      toast("Horário cadastrado com sucesso!");
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setError("Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Adicionar Horário</DialogTitle>
          <DialogDescription>
            Defina o dia e horário das aulas desta disciplina.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 rounded-md bg-red-950/60 border border-red-800/80 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Dia da Semana *
            </label>
            <Select
              value={dayOfWeek.toString()}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
            >
              {DAYS_OF_WEEK.map((dayName, idx) => (
                <option key={idx} value={idx.toString()}>
                  {dayName}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Hora Inicial (HH:MM) *
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Hora Final (HH:MM) *
              </label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Sala / Local específico (opcional)
            </label>
            <Input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Ex: Lab 102, Auditório"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Adicionar Horário"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
