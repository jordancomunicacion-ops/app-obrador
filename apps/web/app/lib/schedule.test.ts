import { describe, expect, it } from 'vitest';
import { isOnShift } from './schedule';
import { WeekSchedule } from './definitions';

// 2026-06-15 es lunes; las fechas se interpretan en UTC como los dueDate.
const monday = new Date('2026-06-15T00:00:00.000Z');
const tuesday = new Date('2026-06-16T00:00:00.000Z');

describe('isOnShift', () => {
    it('sin horario en la ficha devuelve null (desconocido)', () => {
        expect(isOnShift(null, monday, '10:00', '12:00')).toBeNull();
        expect(isOnShift({}, monday, '10:00', '12:00')).toBeNull();
        expect(isOnShift({ mon: null, tue: null }, monday, '10:00', '12:00')).toBeNull();
    });

    it('detecta el solape del turno con la ventana de la tarea', () => {
        const schedule: WeekSchedule = { mon: { start: '09:00', end: '17:00' } };
        expect(isOnShift(schedule, monday, '10:00', '12:00')).toBe(true);
        expect(isOnShift(schedule, monday, '16:30', '18:00')).toBe(true);
        expect(isOnShift(schedule, monday, '18:00', '20:00')).toBe(false);
        // Martes libra
        expect(isOnShift(schedule, tuesday, '10:00', '12:00')).toBe(false);
    });

    it('sin ventana horaria basta con trabajar ese día', () => {
        const schedule: WeekSchedule = { mon: { start: '09:00', end: '17:00' } };
        expect(isOnShift(schedule, monday, null, null)).toBe(true);
        expect(isOnShift(schedule, tuesday, null, null)).toBe(false);
    });

    it('un turno que cruza la medianoche cubre la madrugada del día siguiente', () => {
        const schedule: WeekSchedule = { mon: { start: '18:00', end: '02:00' } };
        expect(isOnShift(schedule, monday, '20:00', '22:00')).toBe(true);
        // La cola del turno del lunes cae en la madrugada del martes
        expect(isOnShift(schedule, tuesday, '00:30', '01:30')).toBe(true);
        expect(isOnShift(schedule, tuesday, '03:00', '05:00')).toBe(false);
        expect(isOnShift(schedule, tuesday, null, null)).toBe(true);
    });

    it('una ventana que cruza la medianoche se cruza con el turno de ese día', () => {
        const schedule: WeekSchedule = { mon: { start: '18:00', end: '23:00' } };
        expect(isOnShift(schedule, monday, '22:00', '01:00')).toBe(true);
        const morning: WeekSchedule = { mon: { start: '09:00', end: '13:00' } };
        expect(isOnShift(morning, monday, '22:00', '01:00')).toBe(false);
    });
});
