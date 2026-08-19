"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatScheduleSlot } from "@/lib/date-utils";
import { User, Clock, MapPin, Gauge } from "lucide-react";

export interface SubjectScheduleItem {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
}

export interface SubjectCardItem {
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
  schedules?: SubjectScheduleItem[];
}

export function SubjectCard({ subject }: { subject: SubjectCardItem }) {
  const primarySchedules = subject.schedules || [];

  return (
    <Link href={`/subjects/${subject.id}`} className="block group">
      <Card className="h-full transition-all duration-200 border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 hover:bg-neutral-900/80">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: subject.color || "#3b82f6" }}
              />
              <CardTitle className="text-base group-hover:text-white transition-colors truncate">
                {subject.name}
              </CardTitle>
            </div>
            {subject.code && (
              <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                {subject.code}
              </Badge>
            )}
          </div>
          {subject.professor && (
            <CardDescription className="flex items-center gap-1.5 mt-1 text-xs">
              <User className="h-3 w-3 text-neutral-500" />
              <span className="truncate">{subject.professor}</span>
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="pt-0 text-xs space-y-2.5">
          {/* Schedules list */}
          {primarySchedules.length > 0 ? (
            <div className="space-y-1">
              {primarySchedules.slice(0, 2).map((sch) => (
                <div key={sch.id} className="flex items-center gap-1.5 text-neutral-300">
                  <Clock className="h-3 w-3 text-neutral-500 shrink-0" />
                  <span>{formatScheduleSlot(sch.dayOfWeek, sch.startTime, sch.endTime)}</span>
                  {sch.room && (
                    <span className="text-neutral-500 text-[11px]">({sch.room})</span>
                  )}
                </div>
              ))}
              {primarySchedules.length > 2 && (
                <p className="text-[10px] text-neutral-500">
                  +{primarySchedules.length - 2} outro(s) horário(s)
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-neutral-500 italic text-[11px]">
              <Clock className="h-3 w-3" />
              <span>Sem horários cadastrados</span>
            </div>
          )}

          {/* Metadata badges */}
          <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-neutral-400">
            <div className="flex items-center gap-1 text-[11px]">
              <span>Freq. mín:</span>
              <span className="font-semibold text-neutral-200">
                {subject.minimumAttendancePercentage}%
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px]">
              <Gauge className="h-3 w-3 text-neutral-500" />
              <span>Dif: {subject.personalDifficulty}/5</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
