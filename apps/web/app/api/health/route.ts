import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Health check para el script de despliegue (DESPLEGAR.bat) y monitorización.
// Comprueba que el proceso responde y que la BD es accesible.
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json({ status: 'ok', db: 'up', time: new Date().toISOString() });
    } catch (err) {
        return NextResponse.json(
            { status: 'error', db: 'down', error: err instanceof Error ? err.message : String(err) },
            { status: 503 },
        );
    }
}
