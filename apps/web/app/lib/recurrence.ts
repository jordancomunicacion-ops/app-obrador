import type { Frequency } from "@prisma/client";

/** Inicio del día en UTC (00:00:00.000). */
export function startOfDayUTC(date: Date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Devuelve true si una programación recurrente debe generar una instancia para la
 * fecha dada según su frecuencia, fecha de inicio/fin y días excluidos. Función pura
 * (sin Prisma), reutilizada por checklists y por los ciclos de producción.
 */
export function scheduleAppliesOn(
  schedule: {
    frequency: Frequency;
    startDate: Date;
    endDate: Date | null;
    excludeWeekdays: number[];
  },
  date: Date,
): boolean {
  const day = startOfDayUTC(date);
  const start = startOfDayUTC(schedule.startDate);
  if (day < start) return false;
  if (schedule.endDate && day > startOfDayUTC(schedule.endDate)) return false;

  // 0=domingo … 6=sábado (UTC)
  const weekday = day.getUTCDay();
  if (schedule.excludeWeekdays.includes(weekday)) return false;

  const msInDay = 24 * 60 * 60 * 1000;
  const daysSinceStart = Math.floor((day.getTime() - start.getTime()) / msInDay);

  switch (schedule.frequency) {
    case "DAILY":
      return true;
    case "WEEKLY":
      return daysSinceStart % 7 === 0;
    case "BIWEEKLY":
      return daysSinceStart % 14 === 0;
    case "MONTHLY":
      return day.getUTCDate() === start.getUTCDate();
    case "QUARTERLY":
      return (
        day.getUTCDate() === start.getUTCDate() &&
        (day.getUTCMonth() - start.getUTCMonth() + 12) % 3 === 0
      );
    case "SEMIANNUAL":
      return (
        day.getUTCDate() === start.getUTCDate() &&
        (day.getUTCMonth() - start.getUTCMonth() + 12) % 6 === 0
      );
    case "ANNUAL":
      return (
        day.getUTCDate() === start.getUTCDate() && day.getUTCMonth() === start.getUTCMonth()
      );
    default:
      return false;
  }
}
