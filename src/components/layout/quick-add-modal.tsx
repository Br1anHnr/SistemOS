"use client";

import * as React from "react";
import { Plus, Calendar, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SemesterModal } from "@/components/semester/semester-modal";
import { SubjectModal } from "@/components/subject/subject-modal";
import { useRouter } from "next/navigation";

interface QuickAddModalProps {
  activeSemesterId?: string;
  availableSemesters?: Array<{ id: string; name: string }>;
}

export function QuickAddModal({
  activeSemesterId,
  availableSemesters = [],
}: QuickAddModalProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [semesterModalOpen, setSemesterModalOpen] = React.useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = React.useState(false);

  return (
    <>
      <Button
        size="sm"
        onClick={() => setMenuOpen(true)}
        className="bg-neutral-100 text-neutral-900 hover:bg-neutral-200 font-medium"
      >
        <Plus className="h-4 w-4 mr-1" />
        Adicionar
      </Button>

      {/* Choose Option Dialog */}
      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogHeader>
          <DialogTitle>Acesso Rápido</DialogTitle>
          <DialogDescription>
            Escolha o que deseja cadastrar no SistemOS:
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-2">
          <button
            onClick={() => {
              setMenuOpen(false);
              setSubjectModalOpen(true);
            }}
            className="flex flex-col items-start p-4 rounded-lg border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 hover:border-neutral-700 transition-all text-left group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-950/60 border border-blue-800 text-blue-400 mb-3 group-hover:scale-105 transition-transform">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm text-neutral-100 mb-1">
              Nova Disciplina
            </span>
            <span className="text-xs text-neutral-400">
              Cadastre uma nova matéria no seu semestre.
            </span>
          </button>

          <button
            onClick={() => {
              setMenuOpen(false);
              setSemesterModalOpen(true);
            }}
            className="flex flex-col items-start p-4 rounded-lg border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 hover:border-neutral-700 transition-all text-left group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-purple-950/60 border border-purple-800 text-purple-400 mb-3 group-hover:scale-105 transition-transform">
              <Calendar className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm text-neutral-100 mb-1">
              Novo Semestre
            </span>
            <span className="text-xs text-neutral-400">
              Inicie um novo período letivo.
            </span>
          </button>
        </div>
      </Dialog>

      {/* Semester Modal */}
      <SemesterModal
        open={semesterModalOpen}
        onOpenChange={setSemesterModalOpen}
        onSuccess={() => router.refresh()}
      />

      {/* Subject Modal */}
      <SubjectModal
        open={subjectModalOpen}
        onOpenChange={setSubjectModalOpen}
        defaultSemesterId={activeSemesterId}
        availableSemesters={availableSemesters}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
