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
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  calculateAttendancePercentage,
  calculateMaximumAbsences,
  calculateRemainingAbsences,
  simulateAbsence,
  AttendanceInput,
} from "@/domain/attendance";
import {
  recordAttendanceAction,
  bulkRecordAttendanceAction,
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
  Filter,
  CheckCheck,
  CalendarDays,
  ChevronRight,
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
  const [bulkLoading, setBulkLoading] = React.useState(false);
  const [manualModalOpen, setManualModalOpen] = React.useState(false);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = React.useState<
    "ALL" | "PENDING" | "ABSENT" | "PRESENT" | "CANCELED"
  >("ALL");
  const [selectedMonth, setSelectedMonth] = React.useState<string>("CURRENT_OR_FIRST");

  // Manual class form state
  const [manualDate, setManualDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [manualStartTime, setManualStartTime] = React.useState("19:00");
  const [manualEndTime, setManualEndTime] = React.useState("20:40");
  const [manualUnits, setManualUnits] = React.useState(1);

  // Simulator state
  const [simulatedUnits, setSimulatedUnits] = React.useState<number>(1);

  // Sort sessions chronologically (closest/earliest date first)
  const sortedSessions = React.useMemo(() => {
    return [...sessions].sort((a, b) => {
      const dateA = a.date + (a.startTime || "");
      const dateB = b.date + (b.startTime || "");
      return dateA.localeCompare(dateB);
    });
  }, [sessions]);

  // Group sessions by Month (e.g. "2026-02")
  const monthsMap = React.useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        label: string;
        sessions: ClassSessionWithAttendance[];
        pendingCount: number;
        presentCount: number;
        absentCount: number;
      }
    >();

    for (const sess of sortedSessions) {
      const monthKey = sess.date.substring(0, 7); // "YYYY-MM"
      const dateObj = new Date(sess.date + "T00:00:00");
      const monthName = dateObj.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
      // Capitalize month name
      const formattedLabel =
        monthName.charAt(0).toUpperCase() + monthName.slice(1);

      if (!map.has(monthKey)) {
        map.set(monthKey, {
          key: monthKey,
          label: formattedLabel,
          sessions: [],
          pendingCount: 0,
          presentCount: 0,
          absentCount: 0,
        });
      }

      const group = map.get(monthKey)!;
      group.sessions.push(sess);

      const status = sess.attendance?.status || "NOT_RECORDED";
      if (sess.status !== "CANCELED") {
        if (status === "NOT_RECORDED" && sess.status === "SCHEDULED") {
          group.pendingCount++;
        } else if (status === "PRESENT") {
          group.presentCount++;
        } else if (status === "ABSENT" || status === "PARTIAL") {
          group.absentCount++;
        }
      }
    }

    return map;
  }, [sortedSessions]);

  const monthKeys = React.useMemo(() => Array.from(monthsMap.keys()), [monthsMap]);

  // Determine active month tab
  const activeMonthKey = React.useMemo(() => {
    if (selectedMonth !== "CURRENT_OR_FIRST" && selectedMonth !== "ALL") {
      if (monthsMap.has(selectedMonth)) return selectedMonth;
    }
    if (selectedMonth === "ALL") return "ALL";

    // Try current calendar month
    const todayMonth = new Date().toISOString().substring(0, 7);
    if (monthsMap.has(todayMonth)) {
      return todayMonth;
    }

    // Otherwise first month or ALL
    return monthKeys[0] || "ALL";
  }, [selectedMonth, monthsMap, monthKeys]);

  // Find next upcoming / today's class
  const todayStr = new Date().toISOString().split("T")[0];
  const nextSession = React.useMemo(() => {
    // Look for first non-canceled session today or in future that is pending or held today
    const upcoming = sortedSessions.find(
      (s) =>
        s.status !== "CANCELED" &&
        s.date >= todayStr &&
        (!s.attendance || s.attendance.status === "NOT_RECORDED")
    );
    if (upcoming) return upcoming;

    // Fallback to first pending class overall
    const firstPending = sortedSessions.find(
      (s) =>
        s.status !== "CANCELED" &&
        (!s.attendance || s.attendance.status === "NOT_RECORDED")
    );
    return firstPending || sortedSessions[0] || null;
  }, [sortedSessions, todayStr]);

  // Filtered sessions for the current view
  const visibleSessions = React.useMemo(() => {
    let list = sortedSessions;

    if (activeMonthKey !== "ALL") {
      const monthGroup = monthsMap.get(activeMonthKey);
      list = monthGroup ? monthGroup.sessions : [];
    }

    return list.filter((sess) => {
      const attStatus = sess.attendance?.status || "NOT_RECORDED";
      if (statusFilter === "PENDING") {
        return (
          sess.status !== "CANCELED" &&
          (attStatus === "NOT_RECORDED" || !sess.attendance)
        );
      }
      if (statusFilter === "ABSENT") {
        return (
          sess.status !== "CANCELED" &&
          (attStatus === "ABSENT" || attStatus === "PARTIAL")
        );
      }
      if (statusFilter === "PRESENT") {
        return sess.status !== "CANCELED" && attStatus === "PRESENT";
      }
      if (statusFilter === "CANCELED") {
        return sess.status === "CANCELED";
      }
      return true;
    });
  }, [sortedSessions, activeMonthKey, monthsMap, statusFilter]);

  // Domain Calculations
  const attendanceInputs: AttendanceInput[] = React.useMemo(() => {
    return sortedSessions.map((s) => ({
      session: {
        absenceUnits: s.absenceUnits,
        isCanceled: s.status === "CANCELED",
      },
      absentUnits: s.attendance ? s.attendance.absentUnits : 0,
    }));
  }, [sortedSessions]);

  const activeSessions = sortedSessions.filter((s) => s.status !== "CANCELED");
  const totalUnits = activeSessions.reduce((sum, s) => sum + s.absenceUnits, 0);
  const totalAbsentUnits = sortedSessions.reduce(
    (sum, s) =>
      sum +
      (s.status !== "CANCELED" && s.attendance ? s.attendance.absentUnits : 0),
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
        toast("Frequência registrada com sucesso!");
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

  const handleMarkAllMonthPresent = async () => {
    if (activeMonthKey === "ALL") {
      toast("Selecione um mês específico para marcar todas como presentes.", "error");
      return;
    }

    const monthGroup = monthsMap.get(activeMonthKey);
    if (!monthGroup) return;

    const pendingIds = monthGroup.sessions
      .filter(
        (s) =>
          s.status !== "CANCELED" &&
          (!s.attendance || s.attendance.status === "NOT_RECORDED")
      )
      .map((s) => s.id);

    if (pendingIds.length === 0) {
      toast("Todas as aulas deste mês já possuem registro.");
      return;
    }

    if (
      !confirm(
        `Deseja marcar como PRESENTE todas as ${pendingIds.length} aulas pendentes de ${monthGroup.label}?`
      )
    ) {
      return;
    }

    setBulkLoading(true);
    try {
      const res = await bulkRecordAttendanceAction(
        pendingIds,
        "PRESENT",
        0,
        subjectId
      );
      if (res.success) {
        toast(`${res.count} aulas marcadas como Presente!`);
        router.refresh();
      } else {
        toast(res.error || "Erro ao atualizar em lote.", "error");
      }
    } catch {
      toast("Erro ao marcar presenças.", "error");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleToggleCancel = async (session: ClassSessionWithAttendance) => {
    const newStatus = session.status === "CANCELED" ? "SCHEDULED" : "CANCELED";
    setActionLoadingId(session.id);
    try {
      const res = await updateClassSessionStatusAction(session.id, subjectId, newStatus);
      if (res.success) {
        toast(newStatus === "CANCELED" ? "Aula cancelada." : "Aula reativada.");
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
    if (!confirm("Deseja excluir esta aula do cronograma?")) return;
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
        toast("Aula extra adicionada com sucesso!");
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
              variant={
                isAtRisk
                  ? "destructive"
                  : percentage !== null && percentage >= minimumAttendancePercentage
                  ? "success"
                  : "warning"
              }
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
            unidade(s) de falta em {totalUnits} aulas
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
            faltas permitidas ({(100 - minimumAttendancePercentage)}% de {totalUnits})
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
              ? "Limite de faltas atingido!"
              : "ausência(s) antes de reprovar"}
          </div>
        </Card>
      </div>

      {/* Next Class Quick Action Hero Card */}
      {nextSession && (
        <Card className="border-neutral-800 bg-gradient-to-r from-blue-950/20 via-neutral-900/50 to-neutral-900/30 p-4 border-l-4 border-l-blue-500">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg bg-blue-950/80 border border-blue-850 text-blue-300 font-mono shrink-0">
                <span className="text-[10px] uppercase">
                  {new Date(nextSession.date + "T00:00:00")
                    .toLocaleDateString("pt-BR", { month: "short" })
                    .replace(".", "")}
                </span>
                <span className="text-base font-bold leading-none">
                  {new Date(nextSession.date + "T00:00:00").getDate()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                    {nextSession.date === todayStr ? "Aula de Hoje" : "Próxima Aula na Grade"}
                  </span>
                  <span className="text-xs text-neutral-400 font-medium">
                    {new Date(nextSession.date + "T00:00:00").toLocaleDateString("pt-BR", {
                      weekday: "long",
                    })}
                  </span>
                  {nextSession.startTime && (
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {nextSession.startTime.substring(0, 5)}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-neutral-300 mt-1">
                  Status atual:{" "}
                  <strong className="text-neutral-100">
                    {nextSession.attendance?.status === "PRESENT"
                      ? "Presente"
                      : nextSession.attendance?.status === "ABSENT"
                      ? "Falta"
                      : "Pendente de registro"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant={
                  nextSession.attendance?.status === "PRESENT" ? "default" : "outline"
                }
                onClick={() => handleRecord(nextSession.id, "PRESENT", 0)}
                disabled={actionLoadingId === nextSession.id}
                className="h-8 text-xs bg-emerald-700/80 hover:bg-emerald-600 border-emerald-600 text-white"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Marcar Presença
              </Button>

              <Button
                size="sm"
                variant={
                  nextSession.attendance?.status === "ABSENT" ? "destructive" : "outline"
                }
                onClick={() =>
                  handleRecord(nextSession.id, "ABSENT", nextSession.absenceUnits)
                }
                disabled={actionLoadingId === nextSession.id}
                className="h-8 text-xs border-red-800 text-red-300 hover:bg-red-950/60"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Registrar Falta
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Simulator Card */}
      <Card className="border-neutral-800 bg-neutral-900/30 p-4">
        <div className="flex items-center gap-2 mb-2">
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
              step="any"
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
              Abaixo do mínimo ({minimumAttendancePercentage}%)!
            </Badge>
          )}
        </div>
      </Card>

      {/* Main Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-neutral-400" />
            Cronograma de Aulas e Chamada ({sortedSessions.length} aulas)
          </h3>
          <p className="text-xs text-neutral-400">
            Organizado em ordem cronológica por mês para fácil navegação e acompanhamento.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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

      {sortedSessions.length === 0 ? (
        <div className="p-8 rounded-lg border border-dashed border-neutral-800 text-center space-y-3">
          <Calendar className="h-8 w-8 text-neutral-500 mx-auto" />
          <h4 className="text-sm font-semibold text-neutral-200">
            Nenhuma aula gerada ainda
          </h4>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Clique em &quot;Gerar Aulas do Semestre&quot; para preencher o cronograma com base nos horários cadastrados da disciplina.
          </p>
          <Button size="sm" onClick={handleGenerate} disabled={generating}>
            <Wand2 className="h-4 w-4 mr-1.5" />
            Gerar Aulas Automaticamente
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Month Tabs Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-neutral-850 text-xs">
            {monthKeys.map((monthKey) => {
              const group = monthsMap.get(monthKey)!;
              const isSelected = activeMonthKey === monthKey;

              return (
                <button
                  key={monthKey}
                  onClick={() => setSelectedMonth(monthKey)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-neutral-800 text-white font-semibold shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                  }`}
                >
                  <span>{group.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected
                        ? "bg-neutral-700 text-neutral-100"
                        : "bg-neutral-900 text-neutral-500"
                    }`}
                  >
                    {group.sessions.length}
                  </span>
                  {group.pendingCount > 0 && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0"
                      title={`${group.pendingCount} pendentes`}
                    />
                  )}
                </button>
              );
            })}

            <button
              onClick={() => setSelectedMonth("ALL")}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-all ${
                activeMonthKey === "ALL"
                  ? "bg-neutral-800 text-white font-semibold"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
              }`}
            >
              Todos os Meses ({sortedSessions.length})
            </button>
          </div>

          {/* Month Summary Bar & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg bg-neutral-950/60 border border-neutral-850 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-neutral-400 font-medium flex items-center gap-1">
                <Filter className="h-3.5 w-3.5 text-neutral-500" />
                Filtro:
              </span>
              <div className="flex rounded-md bg-neutral-900 border border-neutral-800 p-0.5">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                    statusFilter === "ALL"
                      ? "bg-neutral-800 text-white font-medium"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Todas ({visibleSessions.length})
                </button>
                <button
                  onClick={() => setStatusFilter("PENDING")}
                  className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                    statusFilter === "PENDING"
                      ? "bg-neutral-800 text-white font-medium"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Pendentes
                </button>
                <button
                  onClick={() => setStatusFilter("ABSENT")}
                  className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                    statusFilter === "ABSENT"
                      ? "bg-neutral-800 text-white font-medium"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Faltas
                </button>
                <button
                  onClick={() => setStatusFilter("PRESENT")}
                  className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                    statusFilter === "PRESENT"
                      ? "bg-neutral-800 text-white font-medium"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Presentes
                </button>
              </div>
            </div>

            {activeMonthKey !== "ALL" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllMonthPresent}
                disabled={bulkLoading}
                className="h-7 text-xs border-neutral-750 text-neutral-300 hover:text-white"
              >
                {bulkLoading ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                )}
                Marcar mês como Presente
              </Button>
            )}
          </div>

          {/* Classes List */}
          <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
            {visibleSessions.length === 0 ? (
              <div className="p-6 rounded-lg border border-dashed border-neutral-850 text-center text-xs text-neutral-400">
                Nenhuma aula encontrada para os filtros selecionados.
              </div>
            ) : (
              visibleSessions.map((sess) => {
                const isCanceled = sess.status === "CANCELED";
                const attendanceStatus = sess.attendance?.status || "NOT_RECORDED";
                const sessionDate = new Date(sess.date + "T00:00:00");
                const dayOfWeekName = DAYS_OF_WEEK[sessionDate.getDay()] || "";
                const isToday = sess.date === todayStr;

                return (
                  <div
                    key={sess.id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border transition-all ${
                      isCanceled
                        ? "bg-neutral-950/40 border-neutral-900 opacity-60 line-through"
                        : isToday
                        ? "bg-blue-950/20 border-blue-800/60 ring-1 ring-blue-700/30"
                        : attendanceStatus === "ABSENT"
                        ? "bg-red-950/20 border-red-900/40"
                        : attendanceStatus === "PRESENT"
                        ? "bg-emerald-950/15 border-emerald-900/30"
                        : "bg-neutral-900/30 border-neutral-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex flex-col items-center justify-center h-10 w-10 rounded border font-mono text-center shrink-0 ${
                          isToday
                            ? "bg-blue-900/50 border-blue-600 text-blue-200"
                            : "bg-neutral-950 border-neutral-850"
                        }`}
                      >
                        <span className="text-[10px] text-neutral-400 uppercase leading-none">
                          {sessionDate
                            .toLocaleDateString("pt-BR", { month: "short" })
                            .replace(".", "")}
                        </span>
                        <span className="text-sm font-bold text-neutral-100 leading-none mt-0.5">
                          {sessionDate.getDate()}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-xs flex-wrap">
                          <span className="font-semibold text-neutral-200">
                            {sessionDate.toLocaleDateString("pt-BR")} ({dayOfWeekName})
                          </span>
                          {sess.startTime && (
                            <span className="text-neutral-400 font-mono">
                              • {sess.startTime.substring(0, 5)}
                            </span>
                          )}
                          {sess.absenceUnits > 1 && (
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {sess.absenceUnits}x unidades
                            </Badge>
                          )}
                          {isToday && (
                            <Badge variant="info" className="text-[10px]">
                              Hoje
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
                          <strong
                            className={
                              attendanceStatus === "PRESENT"
                                ? "text-emerald-400"
                                : attendanceStatus === "ABSENT"
                                ? "text-red-400"
                                : "text-neutral-300"
                            }
                          >
                            {isCanceled
                              ? "Aula cancelada (não afeta cálculo)"
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
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <Button
                          size="sm"
                          variant={
                            attendanceStatus === "PRESENT" ? "default" : "outline"
                          }
                          onClick={() => handleRecord(sess.id, "PRESENT", 0)}
                          disabled={actionLoadingId === sess.id}
                          className={`h-7 text-xs px-2.5 ${
                            attendanceStatus === "PRESENT"
                              ? "bg-emerald-700 hover:bg-emerald-600 text-white"
                              : "border-neutral-750"
                          }`}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Presente
                        </Button>

                        <Button
                          size="sm"
                          variant={
                            attendanceStatus === "ABSENT" ? "destructive" : "outline"
                          }
                          onClick={() =>
                            handleRecord(sess.id, "ABSENT", sess.absenceUnits)
                          }
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
              })
            )}
          </div>
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
                step="any"
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
