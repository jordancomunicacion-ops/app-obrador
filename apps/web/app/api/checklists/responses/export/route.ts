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

export async function GET(req: NextRequest) {
  const session = await auth();
  const orgId = await currentOrgId();
  if (!session?.user?.id || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = new URL(req.url).searchParams;
  const range = parseDateRange(sp);
  const locationId = await currentLocationId();

  const responses = await prisma.checklistResponse.findMany({
    where: {
      instance: {
        schedule: {
          businessId: orgId,
          ...(locationId ? { locationId } : {}),
        },
        dueDate: { gte: range.from, lte: range.to },
      },
    },
    include: {
      field: { select: { name: true, type: true } },
      answeredBy: { select: { name: true } },
      supervisedBy: { select: { name: true } },
      instance: {
        select: {
          dueDate: true,
          status: true,
          schedule: {
            select: {
              template: { select: { name: true } },
              location: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { answeredAt: "desc" },
  });

  const headers = [
    "Fecha",
    "Local",
    "Plantilla",
    "Estado",
    "Campo",
    "Tipo",
    "Respuesta",
    "Foto",
    "Incidencia",
    "Nota incidencia",
    "Contestada por",
    "Supervisada por",
    "Supervisada en",
  ];
  const lines = [headers.join(";")];

  for (const r of responses) {
    let value: string = "";
    switch (r.field.type) {
      case "CHECK":
        value = r.valueBool ? "Hecho" : "";
        break;
      case "YES_NO":
        value = r.valueBool === true ? "Sí" : r.valueBool === false ? "No" : "";
        break;
      case "TEXT":
        value = r.valueText ?? "";
        break;
      case "RATING_1_10":
        value = r.valueRating !== null ? String(r.valueRating) : "";
        break;
    }
    lines.push(
      [
        new Date(r.instance.dueDate).toISOString().slice(0, 10),
        r.instance.schedule.location.name,
        r.instance.schedule.template.name,
        r.instance.status,
        r.field.name,
        r.field.type,
        value,
        r.photoUrl ?? "",
        r.isIncident ? "Sí" : "No",
        r.incidentNote ?? "",
        r.answeredBy?.name ?? "",
        r.supervisedBy?.name ?? "",
        r.supervisedAt ? r.supervisedAt.toISOString() : "",
      ]
        .map(csvEscape)
        .join(";"),
    );
  }

  const csv = "﻿" + lines.join("\r\n"); // BOM para Excel
  const filename = `respuestas-${range.from.toISOString().slice(0, 10)}_${range.to
    .toISOString()
    .slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
