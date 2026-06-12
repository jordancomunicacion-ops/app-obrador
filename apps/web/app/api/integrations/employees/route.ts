import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
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

/**
 * POST /api/integrations/employees
 *
 * Alta de empleado empujada desde el ERP de contabilidad (ver
 * `pushEmployeeToObrador` en el repo Contabilidad). Idempotente por DNI:
 * upsert del User por NIF normalizado y de su Employment en la primera
 * Empresa activa del negocio, asignando el local de la clave API.
 *
 * Auth: cabecera `x-api-key` (misma clave por local que el GET).
 * Respuesta: `{ created: boolean }` — true si se dio de alta un contrato nuevo.
 */
const PushEmployeeSchema = z.object({
  nif: z.string().trim().min(3, "nif requerido"),
  firstName: z.string().trim().min(1, "firstName requerido"),
  lastName: z.string().trim().min(1, "lastName requerido"),
  email: z.string().trim().toLowerCase().email().nullish().or(z.literal("").transform(() => null)),
  phone: z.string().trim().nullish(),
  position: z.string().trim().nullish(),
  startDate: z.string().trim().nullish(), // YYYY-MM-DD o ISO8601
  active: z.boolean().optional(),
});

/** DNI/NIF normalizado: mayúsculas, sin separadores (clave de cruce entre apps). */
const normalizeNif = (nif: string) => nif.toUpperCase().replace(/[\s.-]/g, "");

// Permisos por defecto de un operario dado de alta desde el ERP. Mismo patrón
// que `addEmployeeToLocation` (apps/web/app/lib/actions/location-employees.ts).
const DEFAULT_PERMS = {
  canViewDashboard: true,
  canViewEvents: true,
  canViewTasks: true,
  canViewCommunications: true,
  canViewCatalog: true,
  canViewOperations: true,
  canViewObrador: true,
  canViewEcommerce: false,
  canViewEmployees: false,
  canManageDirectory: false,
  canEditSettings: false,
  canViewAllNotifications: false,
} as const;

export async function POST(req: NextRequest) {
  const auth = await resolveIntegrationAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!auth.businessId) {
    return NextResponse.json(
      { error: "El local de esta clave no pertenece a ningún negocio" },
      { status: 409 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 });
  }
  const parsed = PushEmployeeSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Payload inválido" },
      { status: 400 },
    );
  }
  const { firstName, lastName, email, phone, position, active } = parsed.data;
  const nif = normalizeNif(parsed.data.nif);

  let startDate: Date | null = null;
  if (parsed.data.startDate) {
    const d = new Date(parsed.data.startDate);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "startDate inválida" }, { status: 400 });
    }
    startDate = d;
  }

  // 1) User por DNI normalizado (User.dni no es unique y puede venir con
  // separadores, así que comparamos normalizado). Si no hay match por DNI
  // pero sí por email, reutilizamos esa cuenta y le anclamos el DNI.
  const candidates = await prisma.user.findMany({
    where: { dni: { not: null } },
    select: { id: true, dni: true, email: true },
  });
  let matched = candidates.find((u) => u.dni && normalizeNif(u.dni) === nif) ?? null;
  if (!matched && email) {
    matched =
      (await prisma.user.findUnique({ where: { email }, select: { id: true, dni: true, email: true } })) ??
      null;
  }
  let userId = matched?.id ?? null;

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  let userCreated = false;
  if (userId && matched) {
    // El email solo se actualiza si el actual es el placeholder de alta
    // importada (es el email de acceso, no pisamos uno real) y el del ERP
    // no lo usa ya otra cuenta.
    let emailUpdate: { email: string } | Record<string, never> = {};
    if (email && matched.email.endsWith("@pendiente.sotodelprior.local") && matched.email !== email) {
      const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (!taken) emailUpdate = { email };
    }
    await prisma.user.update({
      where: { id: userId },
      data: {
        dni: nif,
        firstName,
        lastName,
        name: fullName,
        ...(phone ? { phone } : {}),
        ...emailUpdate,
        approved: true,
      },
    });
  } else {
    // Sin email no podemos invitar: cuenta con email placeholder determinista
    // (idempotente por NIF) y contraseña aleatoria; queda pendiente de que un
    // admin le ponga su email real e invite desde la ficha del empleado.
    const user = await prisma.user.create({
      data: {
        email: email ?? `${nif.toLowerCase()}@pendiente.sotodelprior.local`,
        password: await bcrypt.hash(crypto.randomUUID(), 10),
        name: fullName,
        firstName,
        lastName,
        dni: nif,
        ...(phone ? { phone } : {}),
        role: "USER",
        approved: true,
      },
    });
    userId = user.id;
    userCreated = true;
  }

  // 2) Primera Empresa activa del negocio (crearla si aún no hay, mismo
  // criterio que `ensureEmpresaForBusiness`).
  let empresa = await prisma.empresa.findFirst({
    where: { businessId: auth.businessId, isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!empresa) {
    const business = await prisma.business.findUnique({
      where: { id: auth.businessId },
      select: { name: true },
    });
    empresa = await prisma.empresa.create({
      data: { razonSocial: business?.name ?? "Empresa principal", businessId: auth.businessId },
      select: { id: true },
    });
  }

  // 3) Employment en este negocio: actualizar el activo si existe, si no crearlo
  // asignado al local de la clave.
  const existing = await prisma.employment.findFirst({
    where: { userId, isActive: true, empresa: { businessId: auth.businessId } },
    select: { id: true, assignedLocations: { select: { id: true } } },
  });

  let employmentCreated = false;
  if (existing) {
    const alreadyHere = existing.assignedLocations.some((l) => l.id === auth.locationId);
    await prisma.employment.update({
      where: { id: existing.id },
      data: {
        ...(position ? { position } : {}),
        ...(startDate ? { startDate } : {}),
        ...(active === false ? { isActive: false, endDate: new Date() } : {}),
        ...(alreadyHere ? {} : { assignedLocations: { connect: { id: auth.locationId } } }),
      },
    });
  } else {
    await prisma.employment.create({
      data: {
        userId,
        empresaId: empresa.id,
        position: position ?? null,
        startDate,
        isActive: active !== false,
        department: "GENERAL",
        assignedLocations: { connect: { id: auth.locationId } },
        ...DEFAULT_PERMS,
      },
    });
    employmentCreated = true;
  }

  return NextResponse.json({ created: userCreated || employmentCreated });
}
