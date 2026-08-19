"use client";

import * as React from "react";
import { QuickAddModal } from "@/components/layout/quick-add-modal";
import { Menu, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TopbarProps {
  onToggleSidebarMobile: () => void;
  activeSemester?: { id: string; name: string; academicTerm: string; academicYear: string } | null;
  availableSemesters?: Array<{ id: string; name: string }>;
}

export function Topbar({
  onToggleSidebarMobile,
  activeSemester,
  availableSemesters = [],
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-neutral-850 bg-neutral-950/80 px-4 sm:px-6 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebarMobile}
          className="sm:hidden flex h-8 w-8 items-center justify-center rounded-md border border-neutral-800 text-neutral-400 hover:text-neutral-100"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          {activeSemester ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-neutral-900 border-neutral-800 text-xs font-normal">
                <Calendar className="h-3 w-3 mr-1 text-neutral-400" />
                {activeSemester.name}
              </Badge>
              <span className="hidden md:inline-block text-xs text-neutral-500">
                {activeSemester.academicTerm} • {activeSemester.academicYear}
              </span>
            </div>
          ) : (
            <Badge variant="warning" className="text-xs">
              Nenhum semestre ativo
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <QuickAddModal
          activeSemesterId={activeSemester?.id}
          availableSemesters={availableSemesters}
        />
      </div>
    </header>
  );
}
