import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveIntegrationAuth } from "@/app/lib/integration-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/integrations/employees
 *
 * Plantilla operativa asignada a UN LOCAL concreto: empleados cuyo contrato
 * (Employment) tiene este local en `assignedLocations`, o que tienen
 * pertenencia directa legada (`User.locationId`). El CRM los vincula con
 * Contabilidad por DNI.
 *
 * Auth: cabecera `x-api-key` resuelta a un `locationId`.
 */
export async function GET(req: NextRequest) {
  const auth = await resolveIntegrationAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const users = await prisma.user.findMany({
    where: {
      approved: true,
      role: { not: "SUPERADMIN" },
      OR: [
        // Empleados con pertenencia directa al local (modelo legado).
        { locationId: auth.locationId },
        // Empleados cuyo contrato asigna este local.
        {
          employments: {
            some: { isActive: true, assignedLocations: { some: { id: auth.locationId } } },
          },
        },
      ],
    },
    orderBy: [{ lastName: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      dni: true,
      email: true,
      phone: true,
      jobTitle: true,
      role: true,
      image: true,
      employments: {
        where: { isActive: true },
        select: {
          position: true,
          contractType: true,
          startDate: true,
          empresa: { select: { razonSocial: true, nif: true } },
        },
      },
    },
  });

  return NextResponse.json({
    count: users.length,
    employees: users.map((u) => ({
      id: u.id,
      dni: u.dni,
      name: u.name,
      firstName: u.firstName,
      lastName: u.lastName,
      fullName: ([u.firstName, u.lastName].filter(Boolean).join(" ") || u.name).trim(),
      email: u.email,
      phone: u.phone,
      jobTitle: u.jobTitle,
      role: u.role,
      avatarUrl: u.image,
      employment: u.employments[0]
        ? {
            position: u.employments[0].position,
            contractType: u.employments[0].contractType,
            startDate: u.employments[0].startDate?.toISOString() ?? null,
            empresa: u.employments[0].empresa?.razonSocial ?? null,
            empresaNif: u.employments[0].empresa?.nif ?? null,
          }
        : null,
    })),
  });
}
