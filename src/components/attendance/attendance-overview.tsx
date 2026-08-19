"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import {
  UserCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";

export interface AttendanceSubjectItem {
  subject: {
    id: string;
    name: string;
    code?: string | null;
    color?: string | null;
    minimumAttendancePercentage: number;
  };
  summary: {
    totalSessionsCount: number;
    activeSessionsCount: number;
    totalUnits: number;
    totalAbsentUnits: number;
    percentage: number | null;
    maxAbsences: number;
    remainingAbsences: number;
    isAtRisk: boolean;
  } | null;
}

export function AttendanceOverview({
  activeSemester,
  subjectsAttendance,
}: {
  activeSemester: { id: string; name: string } | null;
  subjectsAttendance: AttendanceSubjectItem[];
}) {
  const router = useRouter();

  if (!activeSemester) {
    return (
      <EmptyState
        icon={Calendar}
        title="Nenhum semestre ativo"
        description="Ative um semestre para gerenciar o controle de faltas e presenças."
        actionLabel="Ir para Semestres"
        onAction={() => router.push("/semester")}
      />
    );
  }

  if (subjectsAttendance.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Nenhuma disciplina cadastrada"
        description="Cadastre suas matérias para começar a controlar sua frequência."
        actionLabel="Ir para Disciplinas"
        onAction={() => router.push("/subjects")}
      />
    );
  }

  const atRiskCount = subjectsAttendance.filter(
    (item) => item.summary?.isAtRisk
  ).length;

  const totalAbsencesCount = subjectsAttendance.reduce(
    (sum, item) => sum + (item.summary?.totalAbsentUnits || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-neutral-800 bg-neutral-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Disciplinas Monitoradas</span>
            <BookOpen className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-neutral-100">
            {subjectsAttendance.length}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">no semestre {activeSemester.name}</p>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Total de Faltas Acumuladas</span>
            <XCircle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-neutral-100">
            {totalAbsencesCount}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">unidades em todas matérias</p>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/40 p-4">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Matérias em Risco de Falta</span>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-neutral-100">
            {atRiskCount}
          </div>
          <p className="text-[11px] text-neutral-400 mt-1">
            {atRiskCount === 0 ? "Nenhuma matéria em risco" : "Atenção necessária"}
          </p>
        </Card>
      </div>

      {/* Subject Attendance Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-100">
          Frequência por Disciplina
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjectsAttendance.map((item) => {
            const { subject, summary } = item;
            const percentage = summary?.percentage;
            const isAtRisk = summary?.isAtRisk || false;
            const hasSessions = (summary?.totalSessionsCount || 0) > 0;

            return (
              <Card
                key={subject.id}
                className={`p-5 border transition-all ${
                  isAtRisk
                    ? "border-red-800/80 bg-red-950/15"
                    : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: subject.color || "#3b82f6" }}
                    />
                    <div>
                      <h4 className="font-semibold text-base text-neutral-100">
                        {subject.name}
                      </h4>
                      {subject.code && (
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {subject.code}
                        </span>
                      )}
                    </div>
                  </div>

                  <Badge
                    variant={
                      isAtRisk
                        ? "destructive"
                        : percentage != null && percentage >= subject.minimumAttendancePercentage
                        ? "success"
                        : "warning"
                    }
                    className="text-xs"
                  >
                    {isAtRisk
                      ? "Risco Excedido"
                      : percentage != null
                      ? `${percentage.toFixed(1)}%`
                      : "100%"}
                  </Badge>
                </div>

                {hasSessions ? (
                  <div className="grid grid-cols-3 gap-2 py-3 my-2 border-y border-neutral-800/60 text-center text-xs">
                    <div>
                      <span className="text-neutral-400 block text-[10px]">Faltas</span>
                      <strong className="text-neutral-100 font-mono text-sm">
                        {summary?.totalAbsentUnits}
                      </strong>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px]">Limite Máx.</span>
                      <strong className="text-neutral-100 font-mono text-sm">
                        {summary?.maxAbsences}
                      </strong>
                    </div>
                    <div>
                      <span className="text-neutral-400 block text-[10px]">Restantes</span>
                      <strong
                        className={`font-mono text-sm ${
                          summary && summary.remainingAbsences <= 1
                            ? "text-red-400 font-bold"
                            : "text-emerald-400"
                        }`}
                      >
                        {summary?.remainingAbsences}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="py-3 my-2 border-y border-neutral-800/60 text-xs text-neutral-500 italic">
                    Nenhuma aula gerada ainda nesta disciplina.
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[11px] text-neutral-400">
                    Mínimo exigido: {subject.minimumAttendancePercentage}%
                  </span>
                  <Link href={`/subjects/${subject.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-blue-400 hover:text-white p-0 hover:bg-transparent"
                    >
                      Gerenciar Presenças <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
