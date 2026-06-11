'use server';

import { z } from 'zod';
import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CreateUserSchema, UpdateUserSchema, EmploymentJornadaSchema, UserFormState } from '@/app/lib/definitions';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';
import { contabilidadConfigured, fetchContabilidadEmployeeByDni, fetchContabilidadEmployees } from '@/app/lib/contabilidad';

export async function createUser(prevState: UserFormState, formData: FormData): Promise<UserFormState> {
    const session = await auth();
    // Only admins or authorized users should create employees
    if (!session?.user?.id) {
        return {
            message: 'No autorizado: Debes iniciar sesión.',
        };
    }

    const validatedFields = CreateUserSchema.safeParse({
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        dni: formData.get('dni'),
        phone: formData.get('phone'),
        jobTitle: formData.get('jobTitle'),
        dob: formData.get('dob'),
        permissions: formData.getAll('permissions'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos obligatorios o datos inválidos.',
        };
    }

    const { name, email, password, role, firstName, lastName, dni, phone, jobTitle, dob, permissions } = validatedFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine adminId. If I am Admin, I am the admin.
    // If I am a Worker (with permission?), my admin is my admin.
    // For now, assume creator is Admin.
    const adminId = session.user.role === 'ADMIN' ? session.user.id : (session.user as any).adminId;

    try {
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                firstName,
                lastName,
                dni,
                phone,
                jobTitle,
                dob: dob ? new Date(dob) : undefined,
                permissions,
                adminId: adminId, // Link to Admin
                approved: true, // Workers created by admin are auto-approved
            },
        });
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error de base de datos: No se pudo crear el usuario. El email podría estar duplicado.',
        };
    }

    revalidatePath('/dashboard/employees');
    redirect('/dashboard/employees');
}

export async function updateUser(
    id: string,
    prevState: UserFormState,
    formData: FormData,
): Promise<UserFormState> {
    const validatedFields = UpdateUserSchema.safeParse({
        id: id,
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password') || undefined,
        role: formData.get('role'),
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        dni: formData.get('dni'),
        phone: formData.get('phone'),
        jobTitle: formData.get('jobTitle'),
        dob: formData.get('dob'),
        permissions: formData.getAll('permissions'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Faltan campos obligatorios.',
        };
    }

    // Jornada y contrato (se guarda en el Employment activo del empleado)
    const validatedJornada = EmploymentJornadaSchema.safeParse({
        employmentId: formData.get('employmentId') || undefined,
        contractType: formData.get('contractType') ?? '',
        contractStart: formData.get('contractStart') || undefined,
        contractEnd: formData.get('contractEnd') || undefined,
        weeklyHours: formData.get('weeklyHours') || undefined,
        partTime: formData.get('partTime') === 'on',
        schedule: formData.get('schedule') || undefined,
    });

    if (!validatedJornada.success) {
        return {
            errors: validatedJornada.error.flatten().fieldErrors as UserFormState['errors'],
            message: 'Revisa los datos de jornada y contrato.',
        };
    }

    const { name, email, password, role, firstName, lastName, dni, phone, jobTitle, dob, permissions } = validatedFields.data;

    const dataToUpdate: any = {
        name,
        email,
        role,
        firstName,
        lastName,
        dni,
        phone,
        jobTitle,
        dob: dob ? new Date(dob) : null,
        permissions,
    };

    if (password && password.trim() !== '') {
        dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    try {
        await prisma.user.update({
            where: { id },
            data: dataToUpdate,
        });

        const { employmentId, contractType, contractStart, contractEnd, weeklyHours, partTime, schedule } =
            validatedJornada.data;
        const hasJornadaData = Boolean(contractType || contractStart || contractEnd || weeklyHours || schedule);

        const employmentData = {
            contractType: contractType || null,
            startDate: contractStart ? new Date(contractStart) : null,
            // El fin de contrato solo aplica a contratos con término (temporal, formación...)
            endDate: contractEnd && contractType !== 'INDEFINIDO' ? new Date(contractEnd) : null,
            weeklyHours: weeklyHours ? Number(weeklyHours) : null,
            partTime,
            schedule: schedule ? JSON.parse(schedule) : null,
        };

        if (employmentId) {
            // Verificar que el contrato pertenece a este usuario antes de tocarlo
            await prisma.employment.update({
                where: { id: employmentId, userId: id },
                data: employmentData,
            });
        } else if (hasJornadaData) {
            // El empleado aún no tiene contrato registrado: lo creamos contra la
            // primera empresa activa (instancia mono-cliente, normalmente hay una).
            const empresa = await prisma.empresa.findFirst({ where: { isActive: true } });
            if (empresa) {
                await prisma.employment.create({
                    data: { userId: id, empresaId: empresa.id, isActive: true, ...employmentData },
                });
            }
        }
    } catch (error) {
        console.error('Database Error:', error);
        return {
            message: 'Error de base de datos: No se pudo actualizar el usuario.',
        };
    }

    revalidatePath('/dashboard/employees');
    redirect('/dashboard/employees');
}

// Busca al empleado en el ERP de contabilidad (cruce por DNI) y devuelve sus
// datos de contrato/jornada para rellenar el formulario de la ficha. No guarda
// nada: el usuario revisa los valores y guarda con "Actualizar Empleado".
export async function importJornadaFromContabilidad(dni: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { ok: false as const, message: 'No autorizado.' };
    }
    if (!contabilidadConfigured()) {
        return {
            ok: false as const,
            message: 'Integración con contabilidad no configurada (CONTABILIDAD_API_URL / CONTABILIDAD_API_KEY).',
        };
    }
    if (!dni || !dni.trim()) {
        return { ok: false as const, message: 'El empleado no tiene DNI: rellénalo para poder cruzar con contabilidad.' };
    }

    try {
        const emp = await fetchContabilidadEmployeeByDni(dni);
        if (!emp) {
            return { ok: false as const, message: `No hay ningún empleado con DNI ${dni} en contabilidad.` };
        }
        return {
            ok: true as const,
            data: {
                contractType: emp.contractType,
                contractStart: emp.startDate ? emp.startDate.slice(0, 10) : '',
                contractEnd: emp.endDate ? emp.endDate.slice(0, 10) : '',
                weeklyHours: String(emp.weeklyHours ?? ''),
                partTime: emp.partTime,
                position: emp.position ?? '',
            },
        };
    } catch (error) {
        console.error('Contabilidad integration error:', error);
        return { ok: false as const, message: 'No se pudo conectar con contabilidad. Inténtalo de nuevo.' };
    }
}

const normalizeNif = (nif: string) => nif.toUpperCase().replace(/[\s.-]/g, '');

// Permisos de un operario importado (mismos que addEmployeeToLocation).
const IMPORT_DEFAULT_PERMS = {
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

/**
 * Importación masiva de la plantilla desde el ERP de contabilidad (cruce por
 * DNI). Para cada empleado activo del ERP:
 *  - Si no existe en el obrador: crea el User (email placeholder si no tiene)
 *    y su Employment con contrato/jornada, asignado al local cuyo nombre casa
 *    con su centro de trabajo (o al primero si no casa ninguno).
 *  - Si ya existe: actualiza el contrato/jornada de su Employment con los
 *    datos del ERP (que es la fuente de la verdad laboral).
 */
export async function importEmployeesFromContabilidad() {
    const session = await auth();
    if (!session?.user?.id) {
        return { ok: false as const, message: 'No autorizado.' };
    }
    if (!contabilidadConfigured()) {
        return {
            ok: false as const,
            message: 'Integración con contabilidad no configurada (CONTABILIDAD_API_URL / CONTABILIDAD_API_KEY).',
        };
    }

    try {
        const plantilla = (await fetchContabilidadEmployees()).filter((e) => e.active && e.nif);
        if (plantilla.length === 0) {
            return { ok: true as const, created: 0, updated: 0, message: 'Contabilidad no tiene empleados activos con NIF.' };
        }

        const empresa = await prisma.empresa.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
        });
        if (!empresa) {
            return { ok: false as const, message: 'No hay ninguna empresa activa donde registrar los contratos.' };
        }
        const locations = await prisma.location.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
            select: { id: true, name: true },
        });

        const usersWithDni = await prisma.user.findMany({
            where: { dni: { not: null } },
            select: { id: true, dni: true },
        });
        const byDni = new Map(usersWithDni.map((u) => [normalizeNif(u.dni!), u.id]));

        let created = 0;
        let updated = 0;
        const detalles: string[] = [];

        for (const emp of plantilla) {
            const nif = normalizeNif(emp.nif);
            const fullName = emp.fullName || [emp.firstName, emp.lastName].filter(Boolean).join(' ');
            const employmentData = {
                position: emp.position ?? null,
                contractType: emp.contractType ?? null,
                startDate: emp.startDate ? new Date(emp.startDate) : null,
                endDate: emp.endDate ? new Date(emp.endDate) : null,
                weeklyHours: emp.weeklyHours ?? null,
                partTime: emp.partTime ?? false,
            };

            let userId = byDni.get(nif) ?? null;
            if (!userId && emp.email) {
                userId = (await prisma.user.findUnique({ where: { email: emp.email }, select: { id: true } }))?.id ?? null;
                if (userId) await prisma.user.update({ where: { id: userId }, data: { dni: nif } });
            }

            if (userId) {
                const employment = await prisma.employment.findFirst({
                    where: { userId, isActive: true, empresaId: empresa.id },
                    select: { id: true },
                });
                if (employment) {
                    await prisma.employment.update({ where: { id: employment.id }, data: employmentData });
                } else {
                    const location = matchLocation(locations, emp.workCenter);
                    await prisma.employment.create({
                        data: {
                            userId,
                            empresaId: empresa.id,
                            isActive: true,
                            department: 'GENERAL',
                            ...(location ? { assignedLocations: { connect: { id: location.id } } } : {}),
                            ...IMPORT_DEFAULT_PERMS,
                            ...employmentData,
                        },
                    });
                }
                updated++;
                detalles.push(`${fullName} (actualizado)`);
            } else {
                const location = matchLocation(locations, emp.workCenter);
                const user = await prisma.user.create({
                    data: {
                        // Email placeholder determinista si el ERP no lo tiene: un admin
                        // pondrá el real desde la ficha antes de invitar al empleado.
                        email: emp.email ?? `${nif.toLowerCase()}@pendiente.sotodelprior.local`,
                        password: await bcrypt.hash(crypto.randomUUID(), 10),
                        name: fullName,
                        firstName: emp.firstName || null,
                        lastName: emp.lastName || null,
                        dni: nif,
                        phone: emp.phone || null,
                        jobTitle: emp.position || null,
                        role: 'USER',
                        approved: true,
                    },
                });
                byDni.set(nif, user.id);
                await prisma.employment.create({
                    data: {
                        userId: user.id,
                        empresaId: empresa.id,
                        isActive: true,
                        department: 'GENERAL',
                        ...(location ? { assignedLocations: { connect: { id: location.id } } } : {}),
                        ...IMPORT_DEFAULT_PERMS,
                        ...employmentData,
                    },
                });
                created++;
                detalles.push(`${fullName}${location ? ` → ${location.name}` : ''}`);
            }
        }

        revalidatePath('/dashboard/employees');
        return { ok: true as const, created, updated, detalles };
    } catch (error) {
        console.error('Contabilidad bulk import error:', error);
        return { ok: false as const, message: 'No se pudo importar la plantilla de contabilidad. Inténtalo de nuevo.' };
    }
}

/** Local cuyo nombre casa con el centro de trabajo del ERP; si no, el primero. */
function matchLocation(
    locations: { id: string; name: string }[],
    workCenter: string | null | undefined,
): { id: string; name: string } | null {
    if (locations.length === 0) return null;
    const wc = (workCenter ?? '').trim().toLowerCase();
    if (wc) {
        const exact = locations.find((l) => l.name.trim().toLowerCase() === wc);
        if (exact) return exact;
        const partial = locations.find(
            (l) => l.name.toLowerCase().includes(wc) || wc.includes(l.name.toLowerCase()),
        );
        if (partial) return partial;
    }
    return locations[0];
}

export async function deleteUser(id: string) {
    try {
        await prisma.user.delete({
            where: { id },
        });
        revalidatePath('/dashboard/employees');
        return { message: 'Usuario eliminado.' };
    } catch (error) {
        console.error('Database Error:', error);
        return { message: 'Error de base de datos: No se pudo eliminar el usuario.' };
    }
}

export async function demoteUser(id: string) {
    try {
        await prisma.user.update({
            where: { id },
            data: { role: 'CHEF' },
        });
        revalidatePath('/dashboard/employees');
        return { message: 'Degraded to Chef' };
    } catch (error) {
        return { message: 'Database Error: Failed to Demote User.' };
    }
}

export async function recoverOrphanUsers() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { message: 'Unauthorized' };

    try {
        const result = await prisma.user.updateMany({
            where: {
                role: 'ADMIN',
                adminId: null,
                id: { not: userId }
            },
            data: {
                adminId: userId,
                role: 'CHEF'
            }
        });

        revalidatePath('/dashboard/employees');
        return { message: `Recuperados ${result.count} usuarios. Ahora aparecen en tu Equipo.` };
    } catch (error) {
        return { message: 'Database Error: Failed to Recover Users.' };
    }
}
