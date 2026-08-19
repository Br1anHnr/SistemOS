"use client";

import * as React from "react";
import { Plus, BookOpen, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import { SubjectCard, SubjectCardItem } from "@/components/subject/subject-card";
import { SubjectModal } from "@/components/subject/subject-modal";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SubjectListProps {
  activeSemester: { id: string; name: string } | null;
  initialSubjects: SubjectCardItem[];
  availableSemesters?: Array<{ id: string; name: string }>;
}

export function SubjectList({
  activeSemester,
  initialSubjects,
  availableSemesters = [],
}: SubjectListProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = React.useState(false);

  if (!activeSemester) {
    return (
      <EmptyState
        icon={CalendarRange}
        title="Nenhum semestre ativo"
        description="Crie seu semestre atual para começar a organizar suas disciplinas."
        actionLabel="Ir para Semestres"
        onAction={() => router.push("/semester")}
      />
    );
  }

  if (initialSubjects.length === 0) {
    return (
      <>
        <EmptyState
          icon={BookOpen}
          title="Nenhuma disciplina cadastrada"
          description={`Você ainda não cadastrou nenhuma disciplina no semestre ativo (${activeSemester.name}).`}
          actionLabel="Adicionar Disciplina"
          onAction={() => setModalOpen(true)}
        />
        <SubjectModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          defaultSemesterId={activeSemester.id}
          availableSemesters={availableSemesters}
          onSuccess={() => router.refresh()}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-neutral-400">
          Mostrando {initialSubjects.length} disciplina(s) em{" "}
          <strong className="text-neutral-200">{activeSemester.name}</strong>
        </span>
        <Button onClick={() => setModalOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Adicionar Disciplina
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialSubjects.map((sub) => (
          <SubjectCard key={sub.id} subject={sub} />
        ))}
      </div>

      <SubjectModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultSemesterId={activeSemester.id}
        availableSemesters={availableSemesters}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
