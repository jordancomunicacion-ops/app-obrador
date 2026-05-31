import { NextRequest, NextResponse } from "next/server";
import { auth, currentOrgId } from "@/auth";
import { currentLocationId } from "@/app/lib/auth/location";
import { prisma } from "@/app/lib/prisma";
import { parseDateRange } from "@/app/lib/reports/kpi";

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v).replace(/"/g, '""');
  return /[",\n\r;]/.test(s) ? `"${s}"` : s;
}

const TYPE_LABEL: Record<string, string> = {
  INCOME: "Ingreso",
  EXPENSE_OPERATING: "Operativo",
  EXPENSE_PAYROLL: "Nómina",
  EXPENSE_SUPPLIER: "Proveedor",
  EXPENSE_OTHER: "Otro",
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

  const entries = await prisma.financialEntry.findMany({
    where: {
      ownerId: orgId,
      ...(locationId ? { OR: [{ locationId }, { locationId: null }] } : {}),
      date: { gte: range.from, lte: range.to },
    },
    include: {
      location: { select: { name: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { date: "asc" },
  });

  const headers = [
    "Fecha",
    "Tipo",
    "Categoría",
    "Importe",
    "Signo",
    "Importe con signo",
    "Local",
    "Responsable",
    "Descripción",
    "Factura",
  ];
  const lines = [headers.join(";")];

  for (const e of entries) {
    const sign = e.type === "INCOME" ? "+" : "-";
    const signed = (e.type === "INCOME" ? 1 : -1) * e.amount;
    lines.push(
      [
        new Date(e.date).toISOString().slice(0, 10),
        TYPE_LABEL[e.type] ?? e.type,
        e.category,
        e.amount.toFixed(2),
        sign,
        signed.toFixed(2),
        e.location?.name ?? "",
        e.createdBy?.name ?? "",
        e.description ?? "",
        e.receiptUrl ?? "",
      ]
        .map(csvEscape)
        .join(";"),
    );
  }

  const csv = "﻿" + lines.join("\r\n");
  const filename = `finanzas-${range.from.toISOString().slice(0, 10)}_${range.to
    .toISOString()
    .slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
