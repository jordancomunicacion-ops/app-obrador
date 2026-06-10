import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Test anti-fuga cross-tenant del selector de cuenta (multi-tenant).
 *
 * Verifica que el aislamiento por negocio/local se respeta en todos los caminos
 * del scope centralizado (`business.ts` + `scope.ts` + `location.ts`), mockeando
 * solo los tres límites externos: la sesión (`@/auth`), las cookies
 * (`next/headers`) y la base de datos (`@/app/lib/prisma`).
 *
 * Modelo de acceso (post-refactor Employment):
 *  - `Business`   = negocio/cliente (A, B, C).
 *  - `Employment` = contrato laboral activo → da acceso al business de su Empresa.
 *  - Dueño legacy = User.id == Business.id (acceso a su propio business).
 *  - SUPERADMIN   = propietario de plataforma, cross-tenant.
 */

// --- Estado mutable + datos en memoria, compartidos con las factorías vi.mock ---
const H = vi.hoisted(() => {
  const state = {
    session: null as any,
    cookies: {} as Record<string, string>,
  };

  // Negocios A, B, C. C es un negocio sin locales (para el caso fail-closed).
  const businesses = [
    { id: 'A', name: 'Empresa A', domain: null, logoUrl: null, createdAt: new Date('2026-01-01') },
    { id: 'B', name: 'Empresa B', domain: null, logoUrl: null, createdAt: new Date('2026-01-02') },
    { id: 'C', name: 'Empresa C', domain: null, logoUrl: null, createdAt: new Date('2026-01-03') },
  ];

  // Usuarios: dueños legacy A/B/C (User.id == Business.id), empleado u, owner de plataforma.
  const users = [
    { id: 'A', role: 'ADMIN', adminId: null, locationId: null, employments: [] },
    { id: 'B', role: 'ADMIN', adminId: null, locationId: null, employments: [] },
    { id: 'C', role: 'ADMIN', adminId: null, locationId: null, employments: [] },
    { id: 'u', role: 'USER', adminId: 'A', locationId: null, employments: [{ assignedLocations: [{ id: 'L1' }] }] },
    { id: 'owner', role: 'SUPERADMIN', adminId: null, locationId: null, employments: [] },
  ];

  // Contratos: u trabaja en una Empresa del negocio A.
  const employments = [
    { userId: 'u', isActive: true, empresa: { businessId: 'A' } },
  ];

  // Locales: L1/L2 pertenecen a A; L9 pertenece a B. C no tiene locales.
  const locations = [
    { id: 'L1', businessId: 'A', isActive: true, name: 'A-1', shortCode: null },
    { id: 'L2', businessId: 'A', isActive: true, name: 'A-2', shortCode: null },
    { id: 'L9', businessId: 'B', isActive: true, name: 'B-1', shortCode: null },
  ];

  // Matcher mínimo de `where` Prisma: igualdad por campo + soporte `{ in: [...] }`.
  const match = (row: any, where: any): boolean => {
    if (!where) return true;
    for (const [k, v] of Object.entries(where)) {
      if (v && typeof v === 'object' && 'in' in (v as any)) {
        if (!(v as any).in.includes(row[k])) return false;
      } else if (row[k] !== v) {
        return false;
      }
    }
    return true;
  };

  const prisma = {
    business: {
      findMany: vi.fn(async ({ where }: any = {}) => businesses.filter((b) => match(b, where))),
      findUnique: vi.fn(async ({ where }: any) => businesses.find((b) => b.id === where.id) ?? null),
    },
    employment: {
      findMany: vi.fn(async ({ where }: any) => employments.filter((e) => match(e, where))),
    },
    user: {
      findFirst: vi.fn(async ({ where }: any) => users.find((u) => match(u, where)) ?? null),
      findUnique: vi.fn(async ({ where }: any) => users.find((u) => u.id === where.id) ?? null),
      findMany: vi.fn(async ({ where }: any) => users.filter((u) => match(u, where))),
    },
    location: {
      findFirst: vi.fn(async ({ where }: any) => locations.find((l) => match(l, where)) ?? null),
      findMany: vi.fn(async ({ where }: any) => locations.filter((l) => match(l, where))),
      findUnique: vi.fn(async ({ where }: any) => locations.find((l) => l.id === where.id) ?? null),
    },
  };

  return { state, businesses, users, employments, locations, prisma };
});

vi.mock('@/auth', () => ({
  auth: vi.fn(async () => H.state.session),
  // Réplica de la delegación real de auth.ts: currentOrgId → currentBusinessId.
  currentOrgId: vi.fn(async () => {
    const { currentBusinessId } = await import('@/app/lib/auth/business');
    return currentBusinessId();
  }),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (k: string) => (k in H.state.cookies ? { value: H.state.cookies[k] } : undefined),
  })),
}));

vi.mock('@/app/lib/prisma', () => ({ prisma: H.prisma }));

import { currentBusinessId, listBusinessesForCurrentUser, BUSINESS_COOKIE } from '@/app/lib/auth/business';
import { currentScope, locationScope } from '@/app/lib/auth/scope';
import { LOCATION_COOKIE } from '@/app/lib/auth/location';

function asPlatform(cookies: Record<string, string> = {}) {
  H.state.session = { user: { id: 'owner', role: 'SUPERADMIN', email: 'super@x.com' } };
  H.state.cookies = cookies;
}

beforeEach(() => {
  H.state.session = null;
  H.state.cookies = {};
  vi.clearAllMocks();
});

describe('multi-tenant · anti-fuga cross-tenant', () => {
  it('A) propietario con negocio A y local de A → scope acotado al local (no global)', async () => {
    asPlatform({ [BUSINESS_COOKIE]: 'A', [LOCATION_COOKIE]: 'L1' });

    expect(await currentBusinessId()).toBe('A');
    expect(await currentScope()).toEqual({ kind: 'location', locationId: 'L1', orgId: 'A' });
    // Clave anti-fuga: NO devuelve {} (que mostraría datos de todos los negocios).
    expect(await locationScope()).toEqual({ locationId: 'L1' });
  });

  it('A2) no puede fijar un local de OTRO negocio (anti-spoof de local)', async () => {
    // L9 es del negocio B; el propietario tiene activo el negocio A.
    asPlatform({ [BUSINESS_COOKIE]: 'A', [LOCATION_COOKIE]: 'L9' });

    // Cae al primer local válido de A (L1); nunca usa el L9 de B.
    expect(await currentScope()).toEqual({ kind: 'location', locationId: 'L1', orgId: 'A' });
    expect(await locationScope()).toEqual({ locationId: 'L1' });
    expect(await locationScope()).not.toEqual({});
  });

  it('B) "Todos los negocios" (sin cookie) → ámbito global EXPLÍCITO', async () => {
    asPlatform({});

    expect(await currentBusinessId()).toBeNull();
    expect(await currentScope()).toEqual({ kind: 'platform' });
    expect(await locationScope()).toEqual({}); // global intencionado, no fuga
  });

  it('C) cookie de negocio falsa (id que no es un Business) → ignorada, no escala', async () => {
    // 'u' es un USER, no un Business: aunque se fuerce la cookie, no concede acceso.
    asPlatform({ [BUSINESS_COOKIE]: 'u' });
    expect(await currentBusinessId()).toBeNull();

    // 'zzz' no existe en absoluto.
    asPlatform({ [BUSINESS_COOKIE]: 'zzz' });
    expect(await currentBusinessId()).toBeNull();
  });

  it('G) negocio seleccionado SIN locales → fail-closed (no ve nada, no global)', async () => {
    asPlatform({ [BUSINESS_COOKIE]: 'C' }); // C existe pero no tiene locales

    expect(await currentBusinessId()).toBe('C');
    expect(await currentScope()).toEqual({ kind: 'none' });
    // Fail-closed: filtro imposible, no {} global.
    expect(await locationScope()).toEqual({ id: '__no_scope__' });
  });

  it('D) dueño legacy (ADMIN): el negocio es el suyo; cookie de otro negocio se ignora', async () => {
    H.state.session = { user: { id: 'A', role: 'ADMIN', email: 'a@x.com' } };
    H.state.cookies = { [BUSINESS_COOKIE]: 'B' }; // intento de spoof: B no está en sus accesibles
    expect(await currentBusinessId()).toBe('A');
  });

  it('E) empleado (USER): el negocio es el de su Employment; cookie de otro negocio se ignora', async () => {
    H.state.session = { user: { id: 'u', role: 'USER', email: 'u@x.com' } };
    H.state.cookies = { [BUSINESS_COOKIE]: 'B' };
    expect(await currentBusinessId()).toBe('A');
  });

  it('F) sin sesión → ningún ámbito (fail-closed)', async () => {
    H.state.session = null;
    expect(await currentScope()).toEqual({ kind: 'none' });
    expect(await locationScope()).toEqual({ id: '__no_scope__' });
  });

  it('H) listBusinessesForCurrentUser: el propietario ve todos; cada tenant, SOLO el suyo', async () => {
    asPlatform({});
    const accs = await listBusinessesForCurrentUser();
    expect(accs.map((a) => a.id).sort()).toEqual(['A', 'B', 'C']);
    expect(accs.find((a) => a.id === 'A')?.name).toBe('Empresa A');
    expect(accs.find((a) => a.id === 'C')?.name).toBeTruthy();

    // Un dueño legacy ve únicamente su propio negocio (nunca los de otros).
    H.state.session = { user: { id: 'A', role: 'ADMIN', email: 'a@x.com' } };
    expect((await listBusinessesForCurrentUser()).map((a) => a.id)).toEqual(['A']);

    // Un empleado ve únicamente el negocio de su Employment.
    H.state.session = { user: { id: 'u', role: 'USER', email: 'u@x.com' } };
    expect((await listBusinessesForCurrentUser()).map((a) => a.id)).toEqual(['A']);
  });
});
