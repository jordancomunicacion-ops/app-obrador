// Cliente de la API de integración del ERP de contabilidad.
// El ERP expone GET /api/integrations/employees (clave en Setting "integration.apiKey",
// se genera en Contabilidad → Jornada → Integración). El cruce con nuestros
// usuarios se hace por DNI/NIF, que es el identificador común entre apps.
//
// Variables de entorno:
//   CONTABILIDAD_API_URL  p. ej. https://contabilidad.sotodelprior.com
//   CONTABILIDAD_API_KEY  clave de integración del ERP

export type ContabilidadEmployee = {
    id: string;
    nif: string;
    code: string | null;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string | null;
    phone: string | null;
    position: string | null;
    category: string | null;
    contractType: string; // INDEFINIDO, TEMPORAL, FORMACION, PRACTICAS
    workCenter: string | null;
    weeklyHours: number;
    partTime: boolean;
    startDate: string | null; // ISO8601
    endDate: string | null;
    active: boolean;
};

export function contabilidadConfigured(): boolean {
    return Boolean(process.env.CONTABILIDAD_API_URL && process.env.CONTABILIDAD_API_KEY);
}

export async function fetchContabilidadEmployees(): Promise<ContabilidadEmployee[]> {
    const baseUrl = process.env.CONTABILIDAD_API_URL;
    const apiKey = process.env.CONTABILIDAD_API_KEY;
    if (!baseUrl || !apiKey) {
        throw new Error(
            'Integración con contabilidad no configurada (CONTABILIDAD_API_URL / CONTABILIDAD_API_KEY).',
        );
    }

    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/integrations/employees?active=all`, {
        headers: { 'x-api-key': apiKey },
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error(`Contabilidad respondió ${res.status} al pedir la plantilla.`);
    }

    const body = await res.json();
    return (body.employees ?? []) as ContabilidadEmployee[];
}

const normalizeNif = (nif: string) => nif.replace(/[\s-]/g, '').toUpperCase();

export async function fetchContabilidadEmployeeByDni(
    dni: string,
): Promise<ContabilidadEmployee | null> {
    const employees = await fetchContabilidadEmployees();
    const target = normalizeNif(dni);
    return employees.find((e) => e.nif && normalizeNif(e.nif) === target) ?? null;
}
