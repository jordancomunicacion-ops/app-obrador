import { WeekSchedule } from '@/app/lib/definitions';

// Cruce del horario semanal del empleado (Employment.schedule, editable en su
// ficha) con la ventana de ejecución de una tarea, para saber quién está en
// turno cuando toca hacerla. Misma convención que la ficha: un tramo cuyo fin
// es anterior o igual al inicio cruza la medianoche (cierre de hostelería).

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

function toMinutes(time: string | null | undefined): number | null {
    if (!time) return null;
    const [h, m] = time.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
}

// Tramo "HH:MM"–"HH:MM" → intervalo en minutos del día; si cruza la medianoche
// el fin se extiende más allá de 1440.
function toInterval(slot: { start: string; end: string } | null | undefined): [number, number] | null {
    const start = toMinutes(slot?.start);
    const end = toMinutes(slot?.end);
    if (start === null || end === null) return null;
    return [start, end <= start ? end + 24 * 60 : end];
}

const overlaps = (a: [number, number], b: [number, number]) =>
    Math.max(a[0], b[0]) < Math.min(a[1], b[1]);

/**
 * ¿Está el empleado en turno durante la ventana de la tarea?
 *  - `true` / `false`: su horario cubre (o no) parte de la ventana ese día.
 *  - `null`: no tiene horario semanal registrado, no podemos saberlo.
 *
 * `date` marca el día (se usa su día de la semana en UTC, como el dueDate de
 * las instancias). Sin ventana horaria, basta con que trabaje ese día.
 * Se tiene en cuenta el turno del día anterior si cruza la medianoche.
 */
export function isOnShift(
    schedule: WeekSchedule | null | undefined,
    date: Date,
    windowStart?: string | null,
    windowEnd?: string | null,
): boolean | null {
    if (!schedule || Object.values(schedule).every((slot) => !toInterval(slot))) {
        return null;
    }

    const day = date.getUTCDay();
    const today = toInterval(schedule[DAY_KEYS[day]]);
    const yesterday = toInterval(schedule[DAY_KEYS[(day + 6) % 7]]);
    // El turno de ayer solo pisa hoy si cruzó la medianoche: su cola es [0, fin].
    const spill: [number, number] | null =
        yesterday && yesterday[1] > 24 * 60 ? [0, yesterday[1] - 24 * 60] : null;

    const winStart = toMinutes(windowStart);
    const winEnd = toMinutes(windowEnd);
    if (winStart === null || winEnd === null) {
        return Boolean(today || spill);
    }
    const window: [number, number] = [winStart, winEnd <= winStart ? winEnd + 24 * 60 : winEnd];

    return Boolean(
        (today && overlaps(today, window)) ||
        (spill && overlaps(spill, window)) ||
        // Ventana que cruza la medianoche: su tramo de madrugada cae en el turno de hoy.
        (today && window[1] > 24 * 60 && overlaps(today, [window[0] - 24 * 60, window[1] - 24 * 60])),
    );
}
