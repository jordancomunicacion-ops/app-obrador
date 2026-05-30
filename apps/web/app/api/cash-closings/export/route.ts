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

const SHIFT_LABEL: Record<string, string> = {
  MORNING: "Comida",
  EVENING: "Cena",
  FULL_DAY: "Día",
};

export async function GET(req: NextRequest) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = new URL(req.url).searchParams;
  const range = parseDateRange(sp);
  const locationId = await currentLocationId();

  const closings = await prisma.cashClosing.findMany({
    where: {
      ownerId: orgId,
      ...(locationId ? { OR: [{ locationId }, { locationId: null }] } : {}),
      date: { gte: range.from, lte: range.to },
    },
    include: {
      closedBy: { select: { name: true } },
      location: { select: { name: true } },
    },
    orderBy: [{ date: "asc" }, { shift: "asc" }],
  });

  const headers = [
    "Fecha",
    "Turno",
    "Local",
    "Responsable",
    "Efectivo",
    "Efectivo esperado",
    "Diferencia",
    "Tarjeta",
    "Otros",
    "Propinas",
    "Total ingresos",
    "Notas",
  ];
  const lines = [headers.join(";")];

  for (const c of closings) {
    const total = c.cashAmount + c.cardAmount + c.otherAmount;
    lines.push(
      [
        new Date(c.date).toISOString().slice(0, 10),
        SHIFT_LABEL[c.shift] ?? c.shift,
        c.location?.name ?? "",
        c.closedBy?.name ?? "",
        c.cashAmount.toFixed(2),
        c.expectedCashAmount.toFixed(2),
        c.diff.toFixed(2),
        c.cardAmount.toFixed(2),
        c.otherAmount.toFixed(2),
        c.tips.toFixed(2),
        total.toFixed(2),
        c.notes ?? "",
      ]
        .map(csvEscape)
        .join(";"),
    );
  }

  const csv = "﻿" + lines.join("\r\n");
  const filename = `cierres-${range.from.toISOString().slice(0, 10)}_${range.to
    .toISOString()
    .slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
