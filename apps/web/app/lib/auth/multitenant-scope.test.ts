import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Test anti-fuga cross-tenant del selector de cuenta (multi-tenant).
 *
 * Verifica que el aislamiento por cuenta/local se respeta en todos los caminos
 * del scope centralizado (`account.ts` + `scope.ts` + `location.ts`), mockeando
 * solo los tres límites externos: la sesión (`@/auth`), las cookies
 * (`next/headers`) y la base de datos (`@/app/lib/prisma`).
 */

// --- Estado mutable + datos en memoria, compartidos con las factorías vi.mock ---
const H = vi.hoisted(() => {
  const state = {
    session: null as any,
    cookies: {} as Record<string, string>,
  };

  // Cuentas (ADMIN) A, B, C; empleado u (de A); propietario de plataforma owner.
  // C es una cuenta ADMIN sin locales (para el caso fail-closed).
  const users = [
    { id: 'A', role: 'ADMIN', adminId: null, name: 'Cliente A', email: 'a@x.com', locationId: null, employments: [], ownedEmpresas: [{ razonSocial: 'Empresa A' }] },
    { id: 'B', role: 'ADMIN', adminId: null, name: 'Cliente B', email: 'b@x.com', locationId: null, employments: [], ownedEmpresas: [{ razonSocial: 'Empresa B' }] },
    { id: 'C', role: 'ADMIN', adminId: null, name: 'Cliente C', email: 'c@x.com', locationId: null, employments: [], ownedEmpresas: [] },
    { id: 'u', role: 'USER', adminId: 'A', name: 'Empleado', email: 'u@x.com', locationId: null, employments: [], ownedEmpresas: [] },
    { id: 'owner', role: 'SUPERADMIN', adminId: null, name: 'Plataforma', email: 'super@x.com', locationId: null, employments: [], ownedEmpresas: [] },
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
    user: {
      findFirst: vi.fn(async ({ where }: any) => users.find((u) => match(u, where)) ?? null),
      findUnique: vi.fn(async ({ where }: any) => users.find((u) => u.id === where.id) ?? null),
      findMany: vi.fn(async ({ where }: any) => users.filter((u) => match(u, where))),
    },
    location: {
      findFirst: vi.fn(async ({ where }: any) => locations.find((l) => match(l, where)) ?? null),
      findMany: vi.fn(async ({ where }: any) => locations.filter((l) => match(l, where))),
    },
  };

  return { state, users, locations, prisma };
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

import { currentBusinessId, listBusinessesForCurrentUser } from '@/app/lib/auth/business';
import { currentScope, locationScope } from '@/app/lib/auth/scope';

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
  it('A) propietario con cuenta A y local de A → scope acotado al local (no global)', async () => {
    asPlatform({ active_account_id: 'A', active_location_id: 'L1' });

    expect(await currentBusinessId()).toBe('A');
    expect(await currentScope()).toEqual({ kind: 'location', locationId: 'L1', orgId: 'A' });
    // Clave anti-fuga: NO devuelve {} (que mostraría datos de todas las cuentas).
    expect(await locationScope()).toEqual({ locationId: 'L1' });
  });

  it('A2) no puede fijar un local de OTRA cuenta (anti-spoof de local)', async () => {
    // L9 es de la cuenta B; el propietario tiene activa la cuenta A.
    asPlatform({ active_account_id: 'A', active_location_id: 'L9' });

    // Cae al primer local válido de A (L1); nunca usa el L9 de B.
    expect(await currentScope()).toEqual({ kind: 'location', locationId: 'L1', orgId: 'A' });
    expect(await locationScope()).toEqual({ locationId: 'L1' });
    expect(await locationScope()).not.toEqual({});
  });

  it('B) "Todas las cuentas" (sin cookie) → ámbito global EXPLÍCITO', async () => {
    asPlatform({});

    expect(await currentBusinessId()).toBeNull();
    expect(await currentScope()).toEqual({ kind: 'platform' });
    expect(await locationScope()).toEqual({}); // global intencionado, no fuga
  });

  it('C) cookie de cuenta falsa (id que no es ADMIN) → ignorada, no escala', async () => {
    // 'u' es un USER: aunque se fuerce la cookie, no concede una cuenta.
    asPlatform({ active_account_id: 'u' });
    expect(await currentBusinessId()).toBeNull();

    // 'zzz' no existe en absoluto.
    asPlatform({ active_account_id: 'zzz' });
    expect(await currentBusinessId()).toBeNull();
  });

  it('G) cuenta seleccionada SIN locales → fail-closed (no ve nada, no global)', async () => {
    asPlatform({ active_account_id: 'C' }); // C es ADMIN pero no tiene locales

    expect(await currentBusinessId()).toBe('C');
    expect(await currentScope()).toEqual({ kind: 'none' });
    // Fail-closed: filtro imposible, no {} global.
    expect(await locationScope()).toEqual({ id: '__no_scope__' });
  });

  it('D) ADMIN: la cuenta es la suya, igual que antes (la cookie se ignora)', async () => {
    H.state.session = { user: { id: 'A', role: 'ADMIN' } };
    H.state.cookies = { active_account_id: 'B' }; // intento de spoof: debe ignorarse
    expect(await currentBusinessId()).toBe('A');
  });

  it('E) USER: la cuenta es la de su admin (adminId), igual que antes', async () => {
    H.state.session = { user: { id: 'u', role: 'USER' } };
    H.state.cookies = { active_account_id: 'B' };
    expect(await currentBusinessId()).toBe('A');
  });

  it('F) sin sesión → ningún ámbito (fail-closed)', async () => {
    H.state.session = null;
    expect(await currentScope()).toEqual({ kind: 'none' });
    expect(await locationScope()).toEqual({ id: '__no_scope__' });
  });

  it('H) listBusinessesForCurrentUser: el propietario ve todas las cuentas ADMIN; el resto, ninguna', async () => {
    asPlatform({});
    const accs = await listBusinessesForCurrentUser();
    expect(accs.map((a) => a.id).sort()).toEqual(['A', 'B', 'C']);
    expect(accs.find((a) => a.id === 'A')?.name).toBe('Empresa A');
    expect(accs.find((a) => a.id === 'C')?.name).toBeTruthy();

    // Un ADMIN no obtiene el selector (lista vacía).
    H.state.session = { user: { id: 'A', role: 'ADMIN' } };
    expect(await listBusinessesForCurrentUser()).toEqual([]);
  });
});
