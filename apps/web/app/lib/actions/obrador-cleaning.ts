'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';

const PATH = '/dashboard/obrador/compliance/cleaning';

const TaskSchema = z.object({
  area: z.string().min(1, { message: 'El área es obligatoria.' }),
  task: z.string().min(1, { message: 'La tarea es obligatoria.' }),
  frequency: z.string().min(1),
});

export type CleaningTaskFormState = {
  errors?: { area?: string[]; task?: string[] };
  message: string | null;
  ok?: boolean;
};

export async function createCleaningTask(
  prevState: CleaningTaskFormState,
  formData: FormData,
): Promise<CleaningTaskFormState> {
  const validated = TaskSchema.safeParse({
    area: formData.get('area'),
    task: formData.get('task'),
    frequency: formData.get('frequency') || 'Diaria',
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors, message: 'Revisa los campos.' };
  }

  try {
    await prisma.obradorCleaningTask.create({ data: validated.data });
  } catch (error) {
    return { message: 'Error al crear la tarea de limpieza.' };
  }

  revalidatePath(PATH);
  return { message: 'Tarea de limpieza añadida.', ok: true };
}

export async function deleteCleaningTask(id: string) {
  await prisma.obradorCleaningTask.delete({ where: { id } }).catch(() => {});
  revalidatePath(PATH);
}

// Registra un cumplimiento de una tarea de limpieza (acción de formulario directa).
export async function logCleaning(formData: FormData) {
  const taskId = (formData.get('taskId') ?? '').toString();
  const status = (formData.get('status') ?? 'Realizado').toString();
  const operatorName = (formData.get('operatorName') ?? '').toString().trim() || 'N/D';
  const observations = (formData.get('observations') ?? '').toString().trim() || null;
  if (!taskId) return;

  const task = await prisma.obradorCleaningTask.findUnique({
    where: { id: taskId },
    select: { id: true },
  });
  if (!task) return;

  await prisma.obradorCleaningLog.create({
    data: { taskId, status, operatorName, observations },
  });
  revalidatePath(PATH);
}
