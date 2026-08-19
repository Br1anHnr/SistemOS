"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  BookOpen,
  Clock,
  Award,
  UserCheck,
  FileText,
  User,
  MapPin,
  Gauge,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SubjectScheduleTab, ScheduleItem } from "@/components/subject/subject-schedule-tab";
import {
  SubjectGradesTab,
  GradingSchemeItem,
  AssessmentItem,
} from "@/components/subject/subject-grades-tab";
import {
  SubjectAttendanceTab,
  ClassSessionWithAttendance,
} from "@/components/subject/subject-attendance-tab";
import {
  SubjectTopicsTab,
  TopicWithAssessment,
  SubjectMaterialItem,
} from "@/components/subject/subject-topics-tab";
import { SubjectModal } from "@/components/subject/subject-modal";
import { deleteSubjectAction } from "@/actions/subject.actions";
import { useToast } from "@/components/ui/toast";
import { formatScheduleSlot } from "@/lib/date-utils";

export interface SubjectDetailsData {
  id: string;
  semesterId: string;
  name: string;
  code?: string | null;
  professor?: string | null;
  room?: string | null;
  workloadHours?: number | null;
  minimumAttendancePercentage: number;
  personalDifficulty: number;
  color?: string | null;
  status: "ACTIVE" | "COMPLETED" | "FAILED" | "DROPPED" | "ARCHIVED";
  semester: { id: string; name: string; academicTerm: string; academicYear: string } | null;
  schedules: ScheduleItem[];
  gradingScheme: GradingSchemeItem | null;
  assessments?: AssessmentItem[];
  classSessions?: ClassSessionWithAttendance[];
  topics?: TopicWithAssessment[];
  materials?: SubjectMaterialItem[];
}

export function SubjectDetails({ subject }: { subject: SubjectDetailsData }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `Tem certeza que deseja excluir a disciplina "${subject.name}"? Todos os horários, notas, faltas e conteúdos também serão removidos.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await deleteSubjectAction(subject.id);
      if (res.success) {
        toast("Disciplina excluída com sucesso!");
        router.push("/subjects");
      } else {
        toast(res.error || "Erro ao excluir disciplina.", "error");
      }
    } catch {
      toast("Erro ao excluir disciplina.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const assessmentOptions = React.useMemo(() => {
    return (subject.assessments || []).map((a) => ({
      id: a.id,
      title: a.title,
    }));
  }, [subject.assessments]);

  return (
    <div className="space-y-6">
      {/* Header & Back Navigation */}
      <div>
        <Link
          href="/subjects"
          className="inline-flex items-center text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Voltar para Disciplinas
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-850">
          <div className="flex items-center gap-3">
            <span
              className="h-4 w-4 rounded-full shrink-0"
              style={{ backgroundColor: subject.color || "#3b82f6" }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
                  {subject.name}
                </h1>
                {subject.code && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {subject.code}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {subject.semester ? `${subject.semester.name} (${subject.semester.academicTerm})` : "Semestre ativo"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(true)}
              className="text-xs border-neutral-800"
            >
              <Edit2 className="h-3.5 w-3.5 mr-1.5" />
              Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-neutral-400 hover:text-red-400 hover:bg-neutral-900"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Excluir
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">
            <BookOpen className="h-3.5 w-3.5 mr-1.5" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="schedules">
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            Horários ({subject.schedules.length})
          </TabsTrigger>
          <TabsTrigger value="grades">
            <Award className="h-3.5 w-3.5 mr-1.5" />
            Notas & Avaliações ({subject.assessments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <UserCheck className="h-3.5 w-3.5 mr-1.5" />
            Faltas & Presenças ({subject.classSessions?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="topics">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            Conteúdos ({subject.topics?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-neutral-800 bg-neutral-900/40">
              <CardContent className="p-4">
                <div className="text-xs text-neutral-400 mb-1 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-neutral-500" />
                  Professor
                </div>
                <div className="text-sm font-semibold text-neutral-100 truncate">
                  {subject.professor || "Não informado"}
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-800 bg-neutral-900/40">
              <CardContent className="p-4">
                <div className="text-xs text-neutral-400 mb-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                  Local / Sala
                </div>
                <div className="text-sm font-semibold text-neutral-100 truncate">
                  {subject.room || "Não informada"}
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-800 bg-neutral-900/40">
              <CardContent className="p-4">
                <div className="text-xs text-neutral-400 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-neutral-500" />
                  Frequência Mínima
                </div>
                <div className="text-sm font-semibold text-neutral-100">
                  {subject.minimumAttendancePercentage}%
                </div>
              </CardContent>
            </Card>

            <Card className="border-neutral-800 bg-neutral-900/40">
              <CardContent className="p-4">
                <div className="text-xs text-neutral-400 mb-1 flex items-center gap-1.5">
                  <Gauge className="h-3.5 w-3.5 text-neutral-500" />
                  Dificuldade
                </div>
                <div className="text-sm font-semibold text-neutral-100">
                  {subject.personalDifficulty} / 5
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Schedule Summary */}
          <Card className="border-neutral-800 bg-neutral-900/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Horários de Aula</CardTitle>
              <CardDescription>Dias em que esta matéria é lecionada</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {subject.schedules.length === 0 ? (
                <p className="text-xs text-neutral-500 italic">
                  Nenhum horário cadastrado ainda. Use a aba &quot;Horários&quot; para adicionar.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {subject.schedules.map((sch) => (
                    <Badge
                      key={sch.id}
                      variant="secondary"
                      className="bg-neutral-950 border-neutral-800 text-xs py-1 px-2.5 font-normal"
                    >
                      <Clock className="h-3 w-3 mr-1.5 text-neutral-400" />
                      {formatScheduleSlot(sch.dayOfWeek, sch.startTime, sch.endTime)}
                      {sch.room && ` (${sch.room})`}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules">
          <SubjectScheduleTab subjectId={subject.id} schedules={subject.schedules} />
        </TabsContent>

        {/* Grades Tab */}
        <TabsContent value="grades">
          <SubjectGradesTab
            subjectId={subject.id}
            gradingScheme={subject.gradingScheme}
            assessments={subject.assessments || []}
          />
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <SubjectAttendanceTab
            subjectId={subject.id}
            minimumAttendancePercentage={subject.minimumAttendancePercentage}
            sessions={subject.classSessions || []}
          />
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics">
          <SubjectTopicsTab
            subjectId={subject.id}
            subjectName={subject.name}
            subjectCode={subject.code}
            topics={subject.topics || []}
            materials={subject.materials || []}
            assessments={assessmentOptions}
          />
        </TabsContent>
      </Tabs>

      <SubjectModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        subjectToEdit={subject}
        defaultSemesterId={subject.semesterId}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
