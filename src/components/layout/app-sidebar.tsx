"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  BookOpen,
  Clock,
  Calendar,
  Award,
  UserCheck,
  TrendingUp,
  GraduationCap,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Início", href: "/", icon: LayoutDashboard },
  { label: "Semestre", href: "/semester", icon: CalendarRange },
  { label: "Disciplinas", href: "/subjects", icon: BookOpen },
  { label: "Estudos", href: "/studies", icon: Clock },
  { label: "Calendário", href: "/calendar", icon: Calendar },
  { label: "Avaliações", href: "/assessments", icon: Award },
  { label: "Faltas", href: "/attendance", icon: UserCheck },
  { label: "Desempenho", href: "/performance", icon: TrendingUp },
  { label: "Graduação", href: "/graduation", icon: GraduationCap },
  { label: "Configurações", href: "/settings", icon: Settings },
];

export function AppSidebar({
  collapsed,
  onToggleCollapse,
  activeSemesterName,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeSemesterName?: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col justify-between border-r border-neutral-850 bg-neutral-950 text-neutral-300 transition-all duration-300 shrink-0 h-screen sticky top-0 z-40",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Brand Header */}
      <div>
        <div className="flex h-14 items-center justify-between px-4 border-b border-neutral-850">
          {!collapsed ? (
            <Link href="/" className="flex items-center gap-2 font-semibold text-neutral-100 tracking-tight">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-neutral-100 text-neutral-950 font-bold text-xs">
                S
              </div>
              <span className="text-sm font-bold">SistemOS</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                v0.1
              </span>
            </Link>
          ) : (
            <Link href="/" className="mx-auto flex h-7 w-7 items-center justify-center rounded bg-neutral-100 text-neutral-950 font-bold text-xs">
              S
            </Link>
          )}

          <button
            onClick={onToggleCollapse}
            className={cn(
              "hidden sm:flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 transition-colors",
              collapsed && "mx-auto mt-2"
            )}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Active Semester Badge */}
        {!collapsed && (
          <div className="px-3 py-3 border-b border-neutral-850/60">
            <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-neutral-900/60 border border-neutral-850 text-xs">
              <span className="text-neutral-400 font-medium truncate">
                {activeSemesterName ? `Semestre: ${activeSemesterName}` : "Sem semestre ativo"}
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            </div>
          </div>
        )}

        {/* Navigation items */}
        <nav className="space-y-1 p-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all group",
                  isActive
                    ? "bg-neutral-900 text-neutral-100 border border-neutral-800 shadow-xs"
                    : "text-neutral-400 hover:bg-neutral-900/50 hover:text-neutral-200",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-neutral-100" : "text-neutral-400 group-hover:text-neutral-200"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer info */}
      {!collapsed && (
        <div className="p-3 border-t border-neutral-850 text-[11px] text-neutral-500">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Sparkles className="h-3 w-3 text-neutral-400" />
            <span>Academic OS</span>
          </div>
        </div>
      )}
    </aside>
  );
}
