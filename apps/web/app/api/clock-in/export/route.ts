import { NextRequest, NextResponse } from "next/server";
import { auth, currentOrgId } from "@/auth";
import { currentLocationId } from "@/lib/auth/location";
import { prisma } from "@/lib/prisma";
import { parseDateRange } from "@/lib/reports/kpi";

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n\r;]/.test(s) ? `"${s}"` : s;
}

function durationHours(start: Date, end: Date | null): string {
  if (!end) return "";
  const ms = end.getTime() - start.getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = new URL(req.url).searchParams;
  const range = parseDateRange(sp);
  const locationId = await currentLocationId();
  const workerId = sp.get("worker");

  const entries = await prisma.clockIn.findMany({
    where: {
      ownerId: orgId,
      startAt: { gte: range.from, lte: range.to },
      ...(workerId ? { workerId } : {}),
      ...(locationId ? { OR: [{ locationId }, { locationId: null }] } : {}),
    },
    include: {
      worker: { select: { name: true, email: true, dni: true } },
      location: { select: { name: true } },
    },
    orderBy: [{ workerId: "asc" }, { startAt: "asc" }],
  });

  const headers = [
    "Fecha",
    "Trabajador",
    "Email",
    "DNI",
    "Local",
    "Entrada",
    "Salida",
    "Duración",
    "Nota",
  ];
  const lines = [headers.join(";")];

  for (const e of entries) {
    lines.push(
      [
        new Date(e.startAt).toISOString().slice(0, 10),
        e.worker.name,
        e.worker.email,
        e.worker.dni ?? "",
        e.location?.name ?? "",
        new Date(e.startAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        e.endAt
          ? new Date(e.endAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
          : "",
        durationHours(e.startAt, e.endAt),
        e.note ?? "",
      ]
        .map(csvEscape)
        .join(";"),
    );
  }

  const csv = "﻿" + lines.join("\r\n"); // BOM para Excel
  const filename = `fichajes-${range.from.toISOString().slice(0, 10)}_${range.to
    .toISOString()
    .slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
