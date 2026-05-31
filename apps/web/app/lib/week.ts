/**
 * Helpers para semanas ISO (lunes-domingo) en UTC.
 */

export function startOfWeekUTC(date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay(); // 0=domingo, 1=lunes, ..., 6=sábado
  const offset = day === 0 ? -6 : 1 - day; // lunes como inicio
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

export function endOfWeekUTC(date = new Date()): Date {
  const start = startOfWeekUTC(date);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

export function addDaysUTC(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function weekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDaysUTC(monday, i));
}

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const WEEKDAY_LABELS_LONG = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
