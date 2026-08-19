export const DAYS_OF_WEEK = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export const SHORT_DAYS_OF_WEEK = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
];

export function formatTime(timeStr: string | null | undefined): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  return `${parts[0]}:${parts[1]}`;
}

export function formatScheduleSlot(
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  shortDay: boolean = false
): string {
  const day = shortDay
    ? SHORT_DAYS_OF_WEEK[dayOfWeek] || `Dia ${dayOfWeek}`
    : (DAYS_OF_WEEK[dayOfWeek] ? DAYS_OF_WEEK[dayOfWeek].replace("-feira", "") : `Dia ${dayOfWeek}`);

  return `${day} • ${formatTime(startTime)}–${formatTime(endTime)}`;
}
