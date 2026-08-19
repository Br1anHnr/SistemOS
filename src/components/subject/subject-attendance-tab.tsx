"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import {
  calculateAttendancePercentage,
  calculateMaximumAbsences,
  calculateRemainingAbsences,
  simulateAbsence,
  AttendanceInput,
} from "@/domain/attendance";
import {
  recordAttendanceAction,
  createClassSessionAction,
  generateClassSessionsAction,
  updateClassSessionStatusAction,
  deleteClassSessionAction,
} from "@/actions/attendance.actions";
import { useToast } from "@/components/ui/toast";
import {
  UserCheck,
  Calendar,
  Sparkles,
  Plus,
  Wand2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Trash2,
  Loader2,
  Ban,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DAYS_OF_WEEK } from "@/lib/date-utils";

export interface ClassSessionWithAttendance {
  id: string;
  subjectId: string;
  scheduleId?: string | null;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  absenceUnits: number;
  status: "SCHEDULED" | "HELD" | "CANCELED";
  attendance?: {
    id: string;
    classSessionId: string;
    status: "PRESENT" | "ABSENT" | "PARTIAL" | "EXCUSED" | "NOT_RECORDED";
    absentUnits: number;
    notes?: string | null;
  } | null;
}

export function SubjectAttendanceTab({
  subjectId,
  minimumAttendancePercentage = 75,
  sessions = [],
}: {
  subjectId: string;
  minimumAttendancePercentage?: number;
  sessions?: ClassSessionWithAttendance[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [generating, setGenerating] = React.useState(false);
  const [manualModalOpen, setManualModalOpen] = React.useState(false);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  // Manual class form state
  const [manualDate, setManualDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [manualStartTime, setManualStartTime] = React.useState("19:00");
  const [manualEndTime, setManualEndTime] = React.useState("20:40");
  const [manualUnits, setManualUnits] = React.useState(1);

  // Simulator state
  const [simulatedUnits, setSimulatedUnits] = React.useState<number>(1);

  // Map to AttendanceInput for pure domain calculations
  const attendanceInputs: AttendanceInput[] = React.useMemo(() => {
    return sessions.map((s) => ({
      session: {
        absenceUnits: s.absenceUnits,
        isCanceled: s.status === "CANCELED",
      },
      absentUnits: s.attendance ? s.attendance.absentUnits : 0,
    }));
  }, [sessions]);

  const activeSessions = sessions.filter((s) => s.status !== "CANCELED");
  const totalUnits = activeSessions.reduce((sum, s) => sum + s.absenceUnits, 0);
  const totalAbsentUnits = sessions.reduce(
    (sum, s) =>
      sum + (s.status !== "CANCELED" && s.attendance ? s.attendance.absentUnits : 0),
    0
  );

  const percentage = React.useMemo(() => {
    return calculateAttendancePercentage(attendanceInputs);
  }, [attendanceInputs]);

  const maxAbsences = React.useMemo(() => {
    return calculateMaximumAbsences(totalUnits, minimumAttendancePercentage);
  }, [totalUnits, minimumAttendancePercentage]);

  const remainingAbsences = React.useMemo(() => {
    return calculateRemainingAbsences(
      totalUnits,
      totalAbsentUnits,
      minimumAttendancePercentage
    );
  }, [totalUnits, totalAbsentUnits, minimumAttendancePercentage]);

  const simulatedPercentage = React.useMemo(() => {
    return simulateAbsence(attendanceInputs, simulatedUnits);
  }, [attendanceInputs, simulatedUnits]);

  const isAtRisk = totalAbsentUnits > maxAbsences;

  const handleRecord = async (
    sessionId: string,
    status: "PRESENT" | "ABSENT" | "PARTIAL" | "EXCUSED",
    units: number
  ) => {
    setActionLoadingId(sessionId);
    try {
      const res = await recordAttendanceAction(
        {
          classSessionId: sessionId,
          status,
          absentUnits: units,
        },
        subjectId
      );

      if (res.success) {
        toast("Frequência registrada!");
        router.refresh();
      } else {
        toast(res.error || "Erro ao registrar.", "error");
      }
    } catch {
      toast("Erro ao registrar presença.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleCancel = async (session: ClassSessionWithAttendance) => {
    const newStatus = session.status === "CANCELED" ? "SCHEDULED" : "CANCELED";
    setActionLoadingId(session.id);
    try {
      const res = await updateClassSessionStatusAction(session.id, subjectId, newStatus);
      if (res.success) {
        toast(newStatus === "CANCELED" ? "Aula marcada como cancelada." : "Aula restaurada.");
        router.refresh();
      } else {
        toast(res.error || "Erro ao atualizar aula.", "error");
      }
    } catch {
      toast("Erro ao atualizar status.", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Deseja remover esta aula da lista?")) return;
    try {
      const res = await deleteClassSessionAction(sessionId, subjectId);
      if (res.success) {
        toast("Aula removida.");
        router.refresh();
      } else {
        toast(res.error || "Erro ao remover.", "error");
      }
    } catch {
      toast("Erro ao remover aula.", "error");
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateClassSessionsAction(subjectId);
      if (res.success) {
        toast(`${res.count} aulas geradas com base na grade de horários!`);
        router.refresh();
      } else {
        toast(res.error || "Erro ao gerar aulas.", "error");
      }
    } catch {
      toast("Erro ao gerar aulas do semestre.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createClassSessionAction({
        subjectId,
        date: manualDate,
        startTime: manualStartTime || null,
        endTime: manualEndTime || null,
        absenceUnits: Number(manualUnits),
        status: "SCHEDULED",
      });

      if (res.success) {
        toast("Aula criada com sucesso!");
        setManualModalOpen(false);
        router.refresh();
      } else {
        toast(res.error || "Erro ao criar aula.", "error");
      }
    } catch {
      toast("Erro ao criar aula.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Percentage Card */}
        <Card className="border-neutral-800 bg-neutral-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Frequência Atual</span>
            <UserCheck className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-neutral-100">
              {percentage !== null ? `${percentage.toFixed(1)}%` : "100%"}
            </span>
            <span className="text-xs text-neutral-400">
              / mín: {minimumAttendancePercentage}%
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <Badge
              variant={isAtRisk ? "destructive" : percentage !== null && percentage >= minimumAttendancePercentage ? "success" : "warning"}
              className="text-[10px]"
            >
              {isAtRisk ? "Risco de Reprovação" : "Frequência Regular"}
            </Badge>
          </div>
        </Card>

        {/* Total Absent Units */}
        <Card className="border-neutral-800 bg-neutral-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Faltas Acumuladas</span>
            <XCircle className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-neutral-100">
            {totalAbsentUnits}
          </div>
          <div className="mt-2 text-[11px] text-neutral-400">
            unidade(s) de ausência
          </div>
        </Card>

        {/* Max Absences Allowed */}
        <Card className="border-neutral-800 bg-neutral-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Limite Máximo</span>
            <AlertCircle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-neutral-100">
            {maxAbsences}
          </div>
          <div className="mt-2 text-[11px] text-neutral-400">
            faltas permitidas (25% de {totalUnits} aulas)
          </div>
        </Card>

        {/* Remaining Absences */}
        <Card className="border-neutral-800 bg-neutral-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Faltas Restantes</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-neutral-100">
            {remainingAbsences}
          </div>
          <div className="mt-2 text-[11px] text-neutral-400">
            {remainingAbsences === 0
              ? "Limite atingido ou excedido"
              : "ausência(s) antes de reprovar"}
          </div>
        </Card>
      </div>

      {/* Simulator Card */}
      <Card className="border-neutral-800 bg-neutral-900/30 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-blue-400" />
          <h4 className="text-sm font-semibold text-neutral-100">
            Simulador de Faltas
          </h4>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
          <span className="text-neutral-300">
            Se eu faltar mais
          </span>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max="20"
              value={simulatedUnits}
              onChange={(e) => setSimulatedUnits(Number(e.target.value))}
              className="w-16 h-8 text-center font-mono text-xs"
            />
            <span className="text-neutral-300">aula(s), minha frequência ficará em:</span>
          </div>
          <div className="font-mono font-bold text-sm text-neutral-100 bg-neutral-950 px-2.5 py-1 rounded border border-neutral-800">
            {simulatedPercentage !== null ? `${simulatedPercentage.toFixed(1)}%` : "—"}
          </div>
          {simulatedPercentage !== null && simulatedPercentage < minimumAttendancePercentage && (
            <Badge variant="destructive" className="text-[10px]">
              Abaixo do mínimo!
            </Badge>
          )}
        </div>
      </Card>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100">
            Registro de Aulas e Presenças ({sessions.length})
          </h3>
          <p className="text-xs text-neutral-400">
            Marque presenças, faltas e justifique ausências por aula.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generating}
            className="text-xs border-neutral-750"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Wand2 className="h-3.5 w-3.5 mr-1.5 text-purple-400" />
            )}
            Gerar Aulas do Semestre
          </Button>

          <Button
            size="sm"
            onClick={() => setManualModalOpen(true)}
            className="text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Adicionar Aula
          </Button>
        </div>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="p-8 rounded-lg border border-dashed border-neutral-800 text-center space-y-3">
          <Calendar className="h-8 w-8 text-neutral-500 mx-auto" />
          <h4 className="text-sm font-semibold text-neutral-200">
            Nenhuma aula registrada ainda
          </h4>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Clique em &quot;Gerar Aulas do Semestre&quot; para preencher o cronograma automaticamente com base nos horários cadastrados da disciplina.
          </p>
          <Button size="sm" onClick={handleGenerate} disabled={generating}>
            <Wand2 className="h-4 w-4 mr-1.5" />
            Gerar Aulas Automaticamente
          </Button>
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {sessions.map((sess) => {
            const isCanceled = sess.status === "CANCELED";
            const attendanceStatus = sess.attendance?.status || "NOT_RECORDED";
            const sessionDate = new Date(sess.date + "T00:00:00");
            const dayOfWeekName = DAYS_OF_WEEK[sessionDate.getDay()] || "";

            return (
              <div
                key={sess.id}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border transition-colors ${
                  isCanceled
                    ? "bg-neutral-950/40 border-neutral-900 opacity-60 line-through"
                    : attendanceStatus === "ABSENT"
                    ? "bg-red-950/20 border-red-900/40"
                    : attendanceStatus === "PRESENT"
                    ? "bg-emerald-950/15 border-emerald-900/30"
                    : "bg-neutral-900/30 border-neutral-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center h-10 w-10 rounded bg-neutral-950 border border-neutral-850 font-mono text-center shrink-0">
                    <span className="text-[10px] text-neutral-500 uppercase">
                      {sessionDate.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                    </span>
                    <span className="text-sm font-bold text-neutral-100 leading-none">
                      {sessionDate.getDate()}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-neutral-200">
                        {sessionDate.toLocaleDateString("pt-BR")} ({dayOfWeekName})
                      </span>
                      {sess.startTime && (
                        <span className="text-neutral-400">
                          • {sess.startTime.substring(0, 5)}
                        </span>
                      )}
                      {sess.absenceUnits > 1 && (
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {sess.absenceUnits}x unidades
                        </Badge>
                      )}
                      {isCanceled && (
                        <Badge variant="destructive" className="text-[10px]">
                          Cancelada
                        </Badge>
                      )}
                    </div>

                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Status:{" "}
                      <strong className="text-neutral-300">
                        {isCanceled
                          ? "Aula cancelada (não conta no cálculo)"
                          : attendanceStatus === "PRESENT"
                          ? "Presente"
                          : attendanceStatus === "ABSENT"
                          ? `Falta (${sess.attendance?.absentUnits} unidade)`
                          : attendanceStatus === "PARTIAL"
                          ? "Falta Parcial"
                          : attendanceStatus === "EXCUSED"
                          ? "Falta Justificada"
                          : "Não registrada"}
                      </strong>
                    </div>
                  </div>
                </div>

                {!isCanceled && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      size="sm"
                      variant={attendanceStatus === "PRESENT" ? "default" : "outline"}
                      onClick={() => handleRecord(sess.id, "PRESENT", 0)}
                      disabled={actionLoadingId === sess.id}
                      className="h-7 text-xs px-2.5"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Presente
                    </Button>

                    <Button
                      size="sm"
                      variant={attendanceStatus === "ABSENT" ? "destructive" : "outline"}
                      onClick={() => handleRecord(sess.id, "ABSENT", sess.absenceUnits)}
                      disabled={actionLoadingId === sess.id}
                      className="h-7 text-xs px-2.5 border-neutral-750"
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Falta
                    </Button>

                    <button
                      onClick={() => handleToggleCancel(sess)}
                      className="p-1.5 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded transition-colors"
                      title="Marcar como cancelada"
                    >
                      <Ban className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteSession(sess.id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
                      title="Excluir aula"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Class Modal */}
      <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
        <form onSubmit={handleCreateManual}>
          <DialogHeader>
            <DialogTitle>Adicionar Aula Extra</DialogTitle>
            <DialogDescription>
              Cadastre uma data avulsa de aula (ex: reposição, aula extra).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Data da Aula *
              </label>
              <Input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Horário Inicial
                </label>
                <Input
                  type="time"
                  value={manualStartTime}
                  onChange={(e) => setManualStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Horário Final
                </label>
                <Input
                  type="time"
                  value={manualEndTime}
                  onChange={(e) => setManualEndTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Unidades de Falta desta aula
              </label>
              <Input
                type="number"
                min="1"
                max="5"
                value={manualUnits}
                onChange={(e) => setManualUnits(Number(e.target.value))}
                required
              />
              <p className="text-[11px] text-neutral-400 mt-1">
                Uma aula normal vale 1 unidade. Aulas duplas valem 2 unidades.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setManualModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Criar Aula</Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
