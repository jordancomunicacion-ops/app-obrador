import { ClockIcon, FingerPrintIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface TimeInfoProps {
    plannedStart: Date | null;
    plannedEnd: Date | null;
    realStart: Date | null;
    realEnd: Date | null;
    status: string;
    /** recipe.category — para resaltar puntualidad en finales y duración en intermedias */
    category?: string | null;
}

export default function TimeInfo({ plannedStart, plannedEnd, realStart, realEnd, status, category }: TimeInfoProps) {
    if (!plannedStart && !realStart) return null;

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            day: 'numeric',
            month: 'numeric'
        }).format(date);
    };

    const getDurationInMinutes = (start: Date, end: Date) => {
        return Math.round((end.getTime() - start.getTime()) / 60000);
    };

    const formatDuration = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const plannedDuration = plannedStart && plannedEnd ? getDurationInMinutes(plannedStart, plannedEnd) : 0;

    // Calculate Real Duration
    // If completed: realEnd - realStart
    // If in progress: Now - realStart
    const now = new Date();
    const effectiveEnd = realEnd || (status === 'IN_PROGRESS' && realStart ? now : null);
    const realDuration = realStart && effectiveEnd ? getDurationInMinutes(realStart, effectiveEnd) : 0;

    const diff = realDuration - plannedDuration;
    const isOverTime = diff > 0;
    const isDelayedStart = plannedStart && realStart && realStart.getTime() > plannedStart.getTime();

    // Only show real stats if the task has started
    const hasStarted = !!realStart;

    const isFinal = category === 'ELABORACION_FINAL';

    // Puntualidad (solo elaboraciones FINALES): ¿se termina dentro del plazo (plannedEnd)?
    // Lo que le interesa al admin de un plato final es que esté hecho a la hora prevista,
    // independientemente de cuánto se tarde en hacerlo.
    let punctuality: { label: string; late: boolean } | null = null;
    if (isFinal && plannedEnd) {
        if (realEnd) {
            const lateMin = getDurationInMinutes(plannedEnd, realEnd); // >0 => tarde
            punctuality = lateMin > 0
                ? { label: `Tarde +${formatDuration(lateMin)}`, late: true }
                : { label: 'A tiempo', late: false };
        } else if (status !== 'DONE' && now.getTime() > plannedEnd.getTime()) {
            punctuality = { label: `Fuera de plazo +${formatDuration(getDurationInMinutes(plannedEnd, now))}`, late: true };
        }
    }

    return (
        <div className="mt-2 space-y-1 text-xs border-t border-gray-50 pt-2">
            {/* Puntualidad (solo elaboraciones finales) */}
            {punctuality && (
                <div className="flex justify-end">
                    <span className={clsx("text-[10px] font-semibold px-1.5 py-0.5 rounded", {
                        "bg-red-100 text-red-700": punctuality.late,
                        "bg-green-100 text-green-700": !punctuality.late
                    })}>
                        {punctuality.late ? '⏰ ' : '✓ '}{punctuality.label}
                    </span>
                </div>
            )}

            {/* Planned */}
            <div className="flex justify-between text-gray-500">
                <span className="flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" /> Plan:
                </span>
                <span>
                    {plannedStart ? formatDate(plannedStart) : '--'}
                    {plannedDuration > 0 && ` (${formatDuration(plannedDuration)})`}
                </span>
            </div>

            {/* Real Stats (only if started) */}
            {hasStarted && (
                <div className={clsx("flex justify-between font-medium", {
                    "text-red-600": isOverTime,
                    "text-green-600": !isOverTime
                })}>
                    <span className="flex items-center gap-1">
                        <FingerPrintIcon className="w-3 h-3" /> Real:
                    </span>
                    <div className="flex flex-col items-end">
                        <span>
                            {formatDate(realStart!)}
                            {realDuration > 0 && ` (${formatDuration(realDuration)})`}
                        </span>
                        {/* Difference Badge */}
                        {plannedDuration > 0 && (
                            <span className={clsx("text-[10px] px-1 rounded", {
                                "bg-red-100": isOverTime,
                                "bg-green-100": !isOverTime
                            })}>
                                {isOverTime ? '+' : ''}{formatDuration(diff)}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
