import Link from "next/link";
import clsx from "clsx";
import { prisma } from "@/app/lib/prisma";
import { auth, currentOrgId } from "@/auth";
import { currentLocationId } from "@/app/lib/auth/location";
import {
  Squares2X2Icon,
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

// Frente B (Opción B): vista de seguimiento ÚNICA que junta las dos familias de
// trabajo —PRODUCCIÓN (`Task`) y OPERATIVA (`ChecklistInstance`)— en un solo
// lugar, acotada por local. Solo lectura: no migra datos ni toca los modelos;
// cada fila enlaza a su pantalla de detalle existente.

type Family = "PRODUCCIÓN" | "OPERATIVA";
type Status = "PENDING" | "IN_PROGRESS" | "DONE" | "ISSUE";

type Item = {
  id: string;
  family: Family;
  title: string;
  subtitle: string | null;
  status: Status;
  assignee: string | null;
  time: string | null; // "HH:MM"
  href: string | null;
};

function startOfDayUTC(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function hhmm(d: Date | null): string | null {
  if (!d) return null;
  return new Date(d).toISOString().slice(11, 16);
}

function normTaskStatus(s: string): Status {
  const v = (s || "").toUpperCase();
  if (v === "IN_PROGRESS") return "IN_PROGRESS";
  if (v === "DONE") return "DONE";
  if (v === "ISSUE") return "ISSUE";
  return "PENDING";
}

function normChecklistStatus(s: string): Status {
  switch (s) {
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "DONE":
    case "CLOSED_AUTO":
      return "DONE";
    case "INCIDENT":
      return "ISSUE";
    default:
      return "PENDING";
  }
}

const STATUS_META: Record<Status, { label: string; cls: string }> = {
  PENDING: { label: "Pendiente", cls: "bg-slate-100 text-slate-600" },
  IN_PROGRESS: { label: "En curso", cls: "bg-amber-100 text-amber-700" },
  DONE: { label: "Hecho", cls: "bg-emerald-100 text-emerald-700" },
  ISSUE: { label: "Incidencia", cls: "bg-rose-100 text-rose-700" },
};

export default async function AllWorkPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const orgId = await currentOrgId();
  if (!orgId) {
    return (
      <p className="text-sm text-gray-500">
        Selecciona una cuenta para ver el trabajo del día.
      </p>
    );
  }
  const locationId = await currentLocationId();

  const { date } = await searchParams;
  const base = date ? new Date(`${date}T00:00:00.000Z`) : new Date();
  const dayStart = startOfDayUTC(isNaN(base.getTime()) ? new Date() : base);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const [tasks, instances, users] = await Promise.all([
    // PRODUCCIÓN — Task del día (por hora planificada), acotado por local.
    prisma.task.findMany({
      where: {
        ownerId: orgId,
        ...(locationId ? { locationId } : {}),
        plannedStart: { gte: dayStart, lt: dayEnd },
      },
      select: {
        id: true,
        title: true,
        status: true,
        plannedStart: true,
        assignedToUserId: true,
        action: true,
        targetQuantity: true,
        unit: true,
        recipe: { select: { name: true } },
      },
      orderBy: { plannedStart: "asc" },
      take: 300,
    }),
    // OPERATIVA — ChecklistInstance del día, acotada por local vía su schedule.
    prisma.checklistInstance.findMany({
      where: {
        dueDate: { gte: dayStart, lt: dayEnd },
        schedule: { ownerId: orgId, ...(locationId ? { locationId } : {}) },
      },
      select: {
        id: true,
        status: true,
        assignedToUserId: true,
        schedule: {
          select: {
            executionStartTime: true,
            template: { select: { name: true } },
            location: { select: { name: true } },
          },
        },
      },
      take: 300,
    }),
    prisma.user.findMany({
      where: { OR: [{ id: orgId }, { adminId: orgId }] },
      select: { id: true, name: true },
    }),
  ]);

  const nameById = new Map(users.map((u) => [u.id, u.name]));

  const items: Item[] = [
    ...tasks.map((t): Item => {
      const qty =
        t.targetQuantity != null ? `${t.targetQuantity} ${t.unit ?? ""}`.trim() : null;
      const subtitle = [t.recipe?.name, t.action, qty].filter(Boolean).join(" · ") || null;
      return {
        id: t.id,
        family: "PRODUCCIÓN",
        title: t.title,
        subtitle,
        status: normTaskStatus(t.status),
        assignee: t.assignedToUserId ? nameById.get(t.assignedToUserId) ?? null : null,
        time: hhmm(t.plannedStart),
        href: "/dashboard/tasks/board",
      };
    }),
    ...instances.map((i): Item => ({
      id: i.id,
      family: "OPERATIVA",
      title: i.schedule.template?.name ?? "Checklist",
      subtitle: i.schedule.location?.name ?? null,
      status: normChecklistStatus(i.status),
      assignee: i.assignedToUserId ? nameById.get(i.assignedToUserId) ?? null : null,
      time: i.schedule.executionStartTime ?? null,
      href: `/dashboard/tasks/supervise/${i.id}`,
    })),
  ].sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"));

  const dayISO = dayStart.toISOString().slice(0, 10);
  const prev = new Date(dayStart);
  prev.setUTCDate(prev.getUTCDate() - 1);
  const next = new Date(dayStart);
  next.setUTCDate(next.getUTCDate() + 1);

  const counts = {
    prod: items.filter((i) => i.family === "PRODUCCIÓN").length,
    oper: items.filter((i) => i.family === "OPERATIVA").length,
    done: items.filter((i) => i.status === "DONE").length,
    issues: items.filter((i) => i.status === "ISSUE").length,
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Squares2X2Icon className="w-5 h-5" />
          Todo el trabajo
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/dashboard/tasks/all?date=${prev.toISOString().slice(0, 10)}`} className="px-2 py-1 rounded hover:bg-gray-100">
            ←
          </Link>
          <span className="font-medium text-gray-700">{dayISO}</span>
          <Link href={`/dashboard/tasks/all?date=${next.toISOString().slice(0, 10)}`} className="px-2 py-1 rounded hover:bg-gray-100">
            →
          </Link>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Producción y operativa del día en un solo lugar (acotado al local activo). Vista de solo
        lectura: cada fila enlaza a su pantalla de gestión.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Producción", value: counts.prod },
          { label: "Operativa", value: counts.oper },
          { label: "Hechas", value: counts.done },
          { label: "Incidencias", value: counts.issues },
        ].map((s) => (
          <div key={s.label} className="bg-white p-3 rounded-xl border border-gray-200">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{s.label}</p>
            <p className="text-xl font-bold text-gray-800">{s.value}</p>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500">
          No hay trabajo programado para este día en el local activo.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3 w-16">Hora</th>
                  <th className="px-4 py-3 w-28">Familia</th>
                  <th className="px-4 py-3">Tarea</th>
                  <th className="px-4 py-3">Asignada a</th>
                  <th className="px-4 py-3 w-28">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => {
                  const meta = STATUS_META[item.status];
                  return (
                    <tr key={`${item.family}-${item.id}`} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-gray-500">{item.time ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            item.family === "PRODUCCIÓN"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-sky-100 text-sky-700",
                          )}
                        >
                          {item.family === "PRODUCCIÓN" ? (
                            <BeakerIcon className="w-3 h-3" />
                          ) : (
                            <ClipboardDocumentCheckIcon className="w-3 h-3" />
                          )}
                          {item.family === "PRODUCCIÓN" ? "Producción" : "Operativa"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.href ? (
                          <Link href={item.href} className="font-medium text-gray-800 hover:text-indigo-700">
                            {item.title}
                          </Link>
                        ) : (
                          <span className="font-medium text-gray-800">{item.title}</span>
                        )}
                        {item.subtitle && (
                          <p className="text-xs text-gray-400">{item.subtitle}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {item.assignee ? (
                          <span className="inline-flex items-center gap-1">
                            <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                            {item.assignee}
                          </span>
                        ) : (
                          <span className="text-gray-300 inline-flex items-center gap-1">
                            <ClockIcon className="w-3.5 h-3.5" />
                            Sin asignar
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx("px-2 py-1 rounded text-[10px] font-bold uppercase", meta.cls)}>
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
