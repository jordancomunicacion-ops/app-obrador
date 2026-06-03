'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

// ---------- Temperaturas ----------
const TempSchema = z.object({
  equipmentName: z.string().min(1, { message: 'El equipo es obligatorio.' }),
  temperature: z.coerce.number({ message: 'Temperatura inválida.' }),
  operatorName: z.string().optional(),
  correctiveAction: z.string().optional(),
});

export type TemperatureFormState = {
  errors?: { equipmentName?: string[]; temperature?: string[] };
  message: string | null;
  ok?: boolean;
};

export async function createTemperatureLog(
  prevState: TemperatureFormState,
  formData: FormData,
): Promise<TemperatureFormState> {
  const validated = TempSchema.safeParse({
    equipmentName: formData.get('equipmentName'),
    temperature: formData.get('temperature'),
    operatorName: formData.get('operatorName'),
    correctiveAction: formData.get('correctiveAction'),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors, message: 'Revisa los campos.' };
  }
  const d = validated.data;
  const session = await auth();
  const corrective = d.correctiveAction?.trim() || null;

  try {
    await prisma.obradorTemperatureLog.create({
      data: {
        equipmentName: d.equipmentName,
        temperature: d.temperature,
        operatorName: d.operatorName?.trim() || 'N/D',
        hasIncidence: !!corrective,
        correctiveAction: corrective,
        businessId: session?.user?.id ?? null,
      },
    });
  } catch (error) {
    return { message: 'Error al registrar la temperatura.' };
  }

  revalidatePath('/dashboard/obrador/compliance/temperatures');
  revalidatePath('/dashboard/obrador/compliance');
  return { message: 'Temperatura registrada.', ok: true };
}

export async function deleteTemperatureLog(id: string) {
  const session = await auth();
  const existing = await prisma.obradorTemperatureLog.findFirst({
    where: { id, businessId: session?.user?.id ?? '__none__' },
    select: { id: true },
  });
  if (!existing) return;
  await prisma.obradorTemperatureLog.delete({ where: { id } });
  revalidatePath('/dashboard/obrador/compliance/temperatures');
}

// ---------- Incidencias ----------
const IncidentSchema = z.object({
  type: z.string().min(1, { message: 'El tipo es obligatorio.' }),
  description: z.string().min(1, { message: 'La descripción es obligatoria.' }),
  correctiveAction: z.string().optional(),
  operatorName: z.string().optional(),
});

export type IncidentFormState = {
  errors?: { type?: string[]; description?: string[] };
  message: string | null;
  ok?: boolean;
};

export async function createIncident(
  prevState: IncidentFormState,
  formData: FormData,
): Promise<IncidentFormState> {
  const validated = IncidentSchema.safeParse({
    type: formData.get('type'),
    description: formData.get('description'),
    correctiveAction: formData.get('correctiveAction'),
    operatorName: formData.get('operatorName'),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors, message: 'Revisa los campos.' };
  }
  const d = validated.data;
  const session = await auth();

  try {
    await prisma.obradorIncident.create({
      data: {
        type: d.type,
        description: d.description,
        correctiveAction: d.correctiveAction?.trim() || null,
        operatorName: d.operatorName?.trim() || 'N/D',
        status: 'abierto',
        businessId: session?.user?.id ?? null,
      },
    });
  } catch (error) {
    return { message: 'Error al registrar la incidencia.' };
  }

  revalidatePath('/dashboard/obrador/compliance/incidents');
  revalidatePath('/dashboard/obrador/compliance');
  return { message: 'Incidencia registrada.', ok: true };
}

export async function closeIncident(id: string) {
  const session = await auth();
  const existing = await prisma.obradorIncident.findFirst({
    where: { id, businessId: session?.user?.id ?? '__none__' },
    select: { id: true },
  });
  if (!existing) return;
  await prisma.obradorIncident.update({ where: { id }, data: { status: 'cerrado' } });
  revalidatePath('/dashboard/obrador/compliance/incidents');
  revalidatePath('/dashboard/obrador/compliance');
}

export async function deleteIncident(id: string) {
  const session = await auth();
  const existing = await prisma.obradorIncident.findFirst({
    where: { id, businessId: session?.user?.id ?? '__none__' },
    select: { id: true },
  });
  if (!existing) return;
  await prisma.obradorIncident.delete({ where: { id } });
  revalidatePath('/dashboard/obrador/compliance/incidents');
}
