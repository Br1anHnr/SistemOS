"use client";

import * as React from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  Award,
  Calendar,
  CalendarRange,
  ArrowRight,
  Plus,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { formatScheduleSlot, DAYS_OF_WEEK } from "@/lib/date-utils";
import { SemesterModal } from "@/components/semester/semester-modal";
import { SubjectModal } from "@/components/subject/subject-modal";
import { useRouter } from "next/navigation";

export interface DashboardData {
  activeSemester: {
    id: string;
    name: string;
    academicTerm: string;
    academicYear: string;
    startDate: string;
    endDate: string;
  } | null;
  allSemesters: Array<{ id: string; name: string }>;
  subjects: Array<{
    id: string;
    name: string;
    code?: string | null;
    color?: string | null;
    minimumAttendancePercentage: number;
    personalDifficulty: number;
    schedules: Array<{
      id: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      room?: string | null;
    }>;
  }>;
  todaySchedules: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string | null;
    subject?: {
      id: string;
      name: string;
      code?: string | null;
      color?: string | null;
    } | null;
  }>;
  totalWeeklySchedulesCount: number;
}

export function DashboardView({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [semesterModalOpen, setSemesterModalOpen] = React.useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = React.useState(false);

  const todayDayOfWeek = new Date().getDay();
  const todayName = DAYS_OF_WEEK[todayDayOfWeek] || "Hoje";

  // Dynamic greeting based on current local hour
  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  if (!data.activeSemester) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">{greeting}!</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Bem-vindo ao SistemOS — seu sistema de gestão e planejamento acadêmico.
          </p>
        </div>

        <EmptyState
          icon={CalendarRange}
          title="Nenhum semestre ativo"
          description="Crie seu semestre atual para começar a cadastrar disciplinas, horários e planejar suas notas."
          actionLabel="Criar Primeiro Semestre"
          onAction={() => setSemesterModalOpen(true)}
        />

        <SemesterModal
          open={semesterModalOpen}
          onOpenChange={setSemesterModalOpen}
          onSuccess={() => router.refresh()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-850">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
            {greeting}!
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Semestre em andamento:{" "}
            <strong className="text-neutral-200">
              {data.activeSemester.name}
            </strong>{" "}
            ({data.activeSemester.academicTerm} • {data.activeSemester.academicYear})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-neutral-800"
            onClick={() => setSubjectModalOpen(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Nova Disciplina
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-neutral-800 bg-neutral-900/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span>Disciplinas</span>
              <BookOpen className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-neutral-100">
              {data.subjects.length}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              no semestre ativo
            </p>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span>Aulas / Semana</span>
              <Clock className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-neutral-100">
              {data.totalWeeklySchedulesCount}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              horários cadastrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span>Aulas Hoje</span>
              <Calendar className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-neutral-100">
              {data.todaySchedules.length}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              previstas para {todayName.replace("-feira", "")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-neutral-800 bg-neutral-900/40">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span>Próx. Avaliação</span>
              <Award className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-sm font-semibold text-neutral-200 truncate mt-1">
              Nenhuma
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              0 avaliações agendadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: Aulas de Hoje & Próximas Avaliações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hoje */}
        <Card className="border-neutral-800 bg-neutral-900/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400" />
                Aulas de Hoje ({todayName})
              </CardTitle>
            </div>
            <CardDescription>
              Cronograma diário com base nos seus horários semanais
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0 space-y-2.5">
            {data.todaySchedules.length === 0 ? (
              <div className="p-6 rounded-lg border border-dashed border-neutral-850 text-center text-xs text-neutral-400 space-y-1">
                <CheckCircle2 className="h-5 w-5 text-neutral-600 mx-auto mb-1" />
                <p className="font-medium text-neutral-300">Nenhuma aula cadastrada para hoje.</p>
                <p className="text-[11px] text-neutral-400">Aproveite para adiantar seus estudos ou revisar conteúdos.</p>
              </div>
            ) : (
              data.todaySchedules.map((sch) => (
                <div
                  key={sch.id}
                  className="flex items-center justify-between p-3 rounded-md bg-neutral-950/60 border border-neutral-850"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: sch.subject?.color || "#3b82f6" }}
                    />
                    <div>
                      <div className="text-sm font-semibold text-neutral-100">
                        {sch.subject?.name || "Disciplina"}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {formatScheduleSlot(sch.dayOfWeek, sch.startTime, sch.endTime, true).split(" • ")[1]}
                        {sch.room && ` • Sala ${sch.room}`}
                      </div>
                    </div>
                  </div>

                  {sch.subject && (
                    <Link href={`/subjects/${sch.subject.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-neutral-400 hover:text-white">
                        Ver
                      </Button>
                    </Link>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Próximas Avaliações */}
        <Card className="border-neutral-800 bg-neutral-900/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400" />
              Próximas Avaliações
            </CardTitle>
            <CardDescription>
              Provas, trabalhos e entregas do semestre
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="p-6 rounded-lg border border-dashed border-neutral-850 text-center text-xs text-neutral-400 space-y-1">
              <Award className="h-5 w-5 text-neutral-600 mx-auto mb-1" />
              <p className="font-medium text-neutral-300">Nenhuma avaliação cadastrada.</p>
              <p className="text-[11px] text-neutral-400">
                O gerenciamento detalhado de datas de provas será integrado na aba Avaliações.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disciplinas List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-100">Disciplinas Cursadas</h2>
            <p className="text-xs text-neutral-400">
              Grade do semestre {data.activeSemester.name}
            </p>
          </div>
          <Link href="/subjects">
            <Button variant="ghost" size="sm" className="text-xs text-neutral-300">
              Ver todas <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>

        {data.subjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Nenhuma disciplina cadastrada"
            description="Cadastre as disciplinas deste semestre para montar sua grade de horários e sistema de notas."
            actionLabel="Adicionar Disciplina"
            onAction={() => setSubjectModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.subjects.map((sub) => {
              const mainSchedule = sub.schedules[0];

              return (
                <Link key={sub.id} href={`/subjects/${sub.id}`} className="block group">
                  <Card className="p-4 border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900/80 hover:border-neutral-700 transition-all">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: sub.color || "#3b82f6" }}
                        />
                        <span className="font-semibold text-sm text-neutral-100 group-hover:text-white truncate">
                          {sub.name}
                        </span>
                      </div>
                      {sub.code && (
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {sub.code}
                        </Badge>
                      )}
                    </div>

                    <div className="text-xs text-neutral-400 space-y-1">
                      {mainSchedule ? (
                        <div className="flex items-center gap-1.5 text-neutral-300">
                          <Clock className="h-3 w-3 text-neutral-500" />
                          <span>{formatScheduleSlot(mainSchedule.dayOfWeek, mainSchedule.startTime, mainSchedule.endTime)}</span>
                        </div>
                      ) : (
                        <div className="text-neutral-500 italic text-[11px]">
                          Sem horário definido
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-neutral-850 text-[11px]">
                        <span>Freq. mínima: {sub.minimumAttendancePercentage}%</span>
                        <span className="text-blue-400 group-hover:underline flex items-center">
                          Ver disciplina <ArrowRight className="h-3 w-3 ml-0.5" />
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <SemesterModal
        open={semesterModalOpen}
        onOpenChange={setSemesterModalOpen}
        onSuccess={() => router.refresh()}
      />

      <SubjectModal
        open={subjectModalOpen}
        onOpenChange={setSubjectModalOpen}
        defaultSemesterId={data.activeSemester?.id}
        availableSemesters={data.allSemesters}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
