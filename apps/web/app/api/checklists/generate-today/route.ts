import { NextRequest, NextResponse } from "next/server";
import { auth, currentOrgId } from "@/auth";
import { generateInstancesForDate } from "@/app/lib/actions/checklist-instances";

/**
 * Genera (idempotente) las instancias de checklist del día para el cliente actual.
 * - Se llama implícitamente al cargar /dashboard/today la primera vez del día.
 * - También puede invocarse desde cron externo con un token; por ahora requiere sesión.
 */
export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orgId = await currentOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "No org" }, { status: 403 });
  }
  const result = await generateInstancesForDate(new Date(), orgId);
  return NextResponse.json(result);
}

// También GET por comodidad para llamar desde el browser
export async function GET(req: NextRequest) {
  return POST(req);
}
