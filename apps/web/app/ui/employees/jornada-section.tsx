'use client';

import { useState, useTransition } from 'react';
import { importJornadaFromContabilidad } from '@/app/lib/actions/employees';
import { CONTRACT_TYPES, WeekSchedule, UserFormState } from '@/app/lib/definitions';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const CONTRACT_LABELS: Record<(typeof CONTRACT_TYPES)[number], string> = {
    INDEFINIDO: 'Indefinido',
    TEMPORAL: 'Temporal',
    FORMACION: 'Formación',
    PRACTICAS: 'Prácticas',
    FIJO_DISCONTINUO: 'Fijo discontinuo',
};

const DAYS: { key: keyof WeekSchedule; label: string }[] = [
    { key: 'mon', label: 'Lunes' },
    { key: 'tue', label: 'Martes' },
    { key: 'wed', label: 'Miércoles' },
    { key: 'thu', label: 'Jueves' },
    { key: 'fri', label: 'Viernes' },
    { key: 'sat', label: 'Sábado' },
    { key: 'sun', label: 'Domingo' },
];

// Horas de un tramo "HH:MM" → "HH:MM". Si el fin es anterior o igual al inicio
// se interpreta como turno que cruza la medianoche (cierre de hostelería).
function slotHours(slot: { start: string; end: string } | null | undefined): number {
    if (!slot?.start || !slot?.end) return 0;
    const [sh, sm] = slot.start.split(':').map(Number);
    const [eh, em] = slot.end.split(':').map(Number);
    let minutes = eh * 60 + em - (sh * 60 + sm);
    if (minutes <= 0) minutes += 24 * 60;
    return minutes / 60;
}

const formatHours = (h: number) =>
    Number.isInteger(h) ? `${h}` : h.toFixed(2).replace(/\.?0+$/, '');

export type EmploymentFormData = {
    id: string;
    empresaName: string | null;
    contractType: string | null;
    startDate: string;
    endDate: string;
    weeklyHours: string;
    partTime: boolean;
    schedule: WeekSchedule | null;
};

export default function JornadaSection({
    employment,
    errors,
}: {
    employment: EmploymentFormData | null;
    errors?: UserFormState['errors'];
}) {
    const [contractType, setContractType] = useState(employment?.contractType ?? '');
    const [contractStart, setContractStart] = useState(employment?.startDate ?? '');
    const [contractEnd, setContractEnd] = useState(employment?.endDate ?? '');
    const [weeklyHours, setWeeklyHours] = useState(employment?.weeklyHours ?? '');
    const [partTime, setPartTime] = useState(employment?.partTime ?? false);
    const [schedule, setSchedule] = useState<WeekSchedule>(employment?.schedule ?? {});
    const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [importing, startImport] = useTransition();

    const isTemporal = contractType !== '' && contractType !== 'INDEFINIDO';
    const scheduleTotal = DAYS.reduce((sum, d) => sum + slotHours(schedule[d.key]), 0);

    const setDay = (key: keyof WeekSchedule, field: 'start' | 'end', value: string) => {
        setSchedule((prev) => {
            const current = prev[key] ?? { start: '', end: '' };
            const next = { ...current, [field]: value };
            return { ...prev, [key]: next.start || next.end ? next : null };
        });
    };

    const handleImport = (e: React.MouseEvent<HTMLButtonElement>) => {
        const form = e.currentTarget.form;
        const dni = (form?.elements.namedItem('dni') as HTMLInputElement | null)?.value ?? '';
        setImportMsg(null);
        startImport(async () => {
            const result = await importJornadaFromContabilidad(dni);
            if (!result.ok) {
                setImportMsg({ ok: false, text: result.message });
                return;
            }
            setContractType(result.data.contractType);
            setContractStart(result.data.contractStart);
            setContractEnd(result.data.contractEnd);
            setWeeklyHours(result.data.weeklyHours);
            setPartTime(result.data.partTime);
            // Si la ficha no tiene puesto, aprovechamos el de contabilidad
            const jobTitle = form?.elements.namedItem('jobTitle') as HTMLInputElement | null;
            if (jobTitle && !jobTitle.value && result.data.position) {
                jobTitle.value = result.data.position;
            }
            setImportMsg({ ok: true, text: 'Datos importados de contabilidad. Revisa y pulsa "Actualizar Empleado" para guardar.' });
        });
    };

    return (
        <div className="space-y-4 md:col-span-2 lg:col-span-3">
            <div className="flex items-center justify-between border-b pb-1">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Jornada y Contrato
                    {employment?.empresaName && (
                        <span className="ml-2 normal-case font-normal text-gray-400">· {employment.empresaName}</span>
                    )}
                </h4>
                <button
                    type="button"
                    onClick={handleImport}
                    disabled={importing}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    {importing ? 'Consultando...' : 'Importar de contabilidad'}
                </button>
            </div>
            {importMsg && (
                <p className={`text-xs ${importMsg.ok ? 'text-emerald-600' : 'text-red-500'}`}>{importMsg.text}</p>
            )}

            {employment && <input type="hidden" name="employmentId" value={employment.id} />}
            <input type="hidden" name="schedule" value={JSON.stringify(schedule)} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                    <label htmlFor="contractType" className="block text-sm font-medium text-gray-700 mb-1">Tipo de contrato</label>
                    <select
                        id="contractType"
                        name="contractType"
                        value={contractType}
                        onChange={(e) => setContractType(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                        <option value="">— Sin especificar —</option>
                        {CONTRACT_TYPES.map((t) => (
                            <option key={t} value={t}>{CONTRACT_LABELS[t]}</option>
                        ))}
                    </select>
                    {errors?.contractType?.map((error) => (
                        <p key={error} className="mt-1 text-xs text-red-500">{error}</p>
                    ))}
                </div>
                <div>
                    <label htmlFor="contractStart" className="block text-sm font-medium text-gray-700 mb-1">Inicio contrato</label>
                    <input
                        id="contractStart"
                        name="contractStart"
                        type="date"
                        value={contractStart}
                        onChange={(e) => setContractStart(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className={isTemporal ? '' : 'opacity-50'}>
                    <label htmlFor="contractEnd" className="block text-sm font-medium text-gray-700 mb-1">
                        Fin contrato {contractType === 'TEMPORAL' && <span className="text-red-500">*</span>}
                    </label>
                    <input
                        id="contractEnd"
                        name="contractEnd"
                        type="date"
                        value={contractEnd}
                        onChange={(e) => setContractEnd(e.target.value)}
                        disabled={!isTemporal}
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                    />
                    {!isTemporal && <p className="mt-1 text-xs text-gray-400">Solo contratos con término</p>}
                    {errors?.contractEnd?.map((error) => (
                        <p key={error} className="mt-1 text-xs text-red-500">{error}</p>
                    ))}
                </div>
                <div>
                    <label htmlFor="weeklyHours" className="block text-sm font-medium text-gray-700 mb-1">Horas semanales</label>
                    <input
                        id="weeklyHours"
                        name="weeklyHours"
                        type="number"
                        min={0}
                        max={99}
                        step={0.5}
                        value={weeklyHours}
                        onChange={(e) => setWeeklyHours(e.target.value)}
                        placeholder="40"
                        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {errors?.weeklyHours?.map((error) => (
                        <p key={error} className="mt-1 text-xs text-red-500">{error}</p>
                    ))}
                </div>
                <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="partTime"
                            checked={partTime}
                            onChange={(e) => setPartTime(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Jornada parcial</span>
                    </label>
                </div>
            </div>

            {/* Horario semanal */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">Horario semanal</p>
                    <p className="text-sm text-gray-600">
                        Total horario:{' '}
                        <span className={`font-semibold ${weeklyHours && Math.abs(scheduleTotal - Number(weeklyHours)) > 0.01 && scheduleTotal > 0 ? 'text-amber-600' : 'text-gray-800'}`}>
                            {formatHours(scheduleTotal)} h/semana
                        </span>
                        {weeklyHours && scheduleTotal > 0 && Math.abs(scheduleTotal - Number(weeklyHours)) > 0.01 && (
                            <span className="ml-2 text-xs text-amber-600">(contrato: {weeklyHours} h)</span>
                        )}
                    </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
                    {DAYS.map((day) => {
                        const slot = schedule[day.key];
                        const hours = slotHours(slot);
                        return (
                            <div key={day.key} className="rounded-lg border border-gray-200 p-2">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-medium text-gray-600">{day.label}</span>
                                    <span className="text-[11px] text-gray-400">
                                        {hours > 0 ? `${formatHours(hours)} h` : 'Libre'}
                                    </span>
                                </div>
                                <input
                                    type="time"
                                    aria-label={`${day.label} entrada`}
                                    value={slot?.start ?? ''}
                                    onChange={(e) => setDay(day.key, 'start', e.target.value)}
                                    className="w-full border rounded px-1.5 py-1 text-xs mb-1 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                                <input
                                    type="time"
                                    aria-label={`${day.label} salida`}
                                    value={slot?.end ?? ''}
                                    onChange={(e) => setDay(day.key, 'end', e.target.value)}
                                    className="w-full border rounded px-1.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        );
                    })}
                </div>
                <p className="mt-1 text-xs text-gray-400">Deja un día vacío para marcarlo como libre. Un turno que acaba antes de la hora de entrada se cuenta como turno de madrugada (cruza la medianoche).</p>
            </div>
        </div>
    );
}
