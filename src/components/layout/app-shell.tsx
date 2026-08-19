"use client";

import * as React from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ToastProvider } from "@/components/ui/toast";

interface AppShellProps {
  children: React.ReactNode;
  activeSemester?: {
    id: string;
    name: string;
    academicTerm: string;
    academicYear: string;
  } | null;
  availableSemesters?: Array<{ id: string; name: string }>;
}

export function AppShell({
  children,
  activeSemester,
  availableSemesters = [],
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-neutral-950 text-neutral-100 antialiased selection:bg-neutral-800">
        {/* Desktop Sidebar */}
        <div className="hidden sm:block">
          <AppSidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            activeSemesterName={activeSemester?.name}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 sm:hidden">
            <div
              className="fixed inset-0 bg-black/80"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-64 z-50">
              <AppSidebar
                collapsed={false}
                onToggleCollapse={() => setMobileSidebarOpen(false)}
                activeSemesterName={activeSemester?.name}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col min-w-0">
          <Topbar
            onToggleSidebarMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            activeSemester={activeSemester}
            availableSemesters={availableSemesters}
          />
          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-6xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
