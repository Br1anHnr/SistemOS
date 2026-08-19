export interface TopicItem {
  id: string;
  title: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "REVIEWED" | "COMPLETED" | "ARCHIVED";
  masteryLevel: number; // 0 to 4
  importance: number; // 1 to 5
  estimatedHours?: number | null;
  assessmentId?: string | null;
}

export const MASTERY_LEVELS = [
  { level: 0, label: "Não Iniciado", shortLabel: "0", color: "text-neutral-500 bg-neutral-900 border-neutral-800" },
  { level: 1, label: "Básico / Visto", shortLabel: "1", color: "text-blue-400 bg-blue-950/40 border-blue-800/60" },
  { level: 2, label: "Razoável / Entendido", shortLabel: "2", color: "text-purple-400 bg-purple-950/40 border-purple-800/60" },
  { level: 3, label: "Bom / Praticado", shortLabel: "3", color: "text-amber-400 bg-amber-950/40 border-amber-800/60" },
  { level: 4, label: "Dominado / Revisado", shortLabel: "4", color: "text-emerald-400 bg-emerald-950/40 border-emerald-800/60" },
] as const;

export function calculateTopicProgress(topics: TopicItem[]) {
  const active = topics.filter((t) => t.status !== "ARCHIVED");
  if (active.length === 0) {
    return {
      total: 0,
      completedCount: 0,
      inProgressCount: 0,
      notStartedCount: 0,
      progressPercentage: 0,
    };
  }

  const completedCount = active.filter(
    (t) => t.status === "COMPLETED" || t.masteryLevel === 4
  ).length;

  const inProgressCount = active.filter(
    (t) =>
      t.status !== "COMPLETED" &&
      (t.status === "IN_PROGRESS" || t.status === "REVIEWED" || (t.masteryLevel >= 1 && t.masteryLevel < 4))
  ).length;

  const notStartedCount = active.filter(
    (t) => t.status === "NOT_STARTED" && t.masteryLevel === 0
  ).length;

  const progressPercentage = Math.round((completedCount / active.length) * 100);

  return {
    total: active.length,
    completedCount,
    inProgressCount,
    notStartedCount,
    progressPercentage,
  };
}

export function calculateMasteryAverage(topics: TopicItem[]) {
  const active = topics.filter((t) => t.status !== "ARCHIVED");
  if (active.length === 0) {
    return {
      averageLevel: 0,
      masteryScore: 0,
    };
  }

  const sum = active.reduce((acc, t) => acc + Math.max(0, Math.min(4, t.masteryLevel)), 0);
  const avg = Number((sum / active.length).toFixed(2));
  const masteryScore = Math.round((avg / 4) * 100);

  return {
    averageLevel: avg,
    masteryScore,
  };
}

export function calculateMasteryDistribution(topics: TopicItem[]) {
  const active = topics.filter((t) => t.status !== "ARCHIVED");
  const distribution: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };

  for (const t of active) {
    const lvl = Math.max(0, Math.min(4, t.masteryLevel));
    distribution[lvl] = (distribution[lvl] || 0) + 1;
  }

  return distribution;
}

export function calculateEstimatedRemainingStudyHours(topics: TopicItem[]) {
  const pending = topics.filter(
    (t) => t.status !== "ARCHIVED" && t.status !== "COMPLETED" && t.masteryLevel < 4
  );

  return pending.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
}
