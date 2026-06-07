import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { resolveIntegrationAuth } from "@/app/lib/integration-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/integrations/catalog
 *
 * Catálogo vendible online del LOCAL de la clave: los `MasterProduct` con
 * `isSellableOnline = true`. La tienda web (WEB SOTOdelPRIOR) consume este
 * endpoint para pintar la tienda; el obrador es la fuente de verdad del
 * catálogo y los precios. Se reutiliza la ficha legal/alérgenos/nutrición
 * existente (`ProductSanitaryInfo`) para no duplicar datos.
 *
 * Auth: cabecera `x-api-key` (o `Authorization: Bearer`) resuelta a un local.
 */
export async function GET(req: NextRequest) {
  const auth = await resolveIntegrationAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const products = await prisma.masterProduct.findMany({
    where: { locationId: auth.locationId, isSellableOnline: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      category: true,
      onlineCategory: true,
      description: true,
      salePrice: true,
      onlineDescription: true,
      onlineImageUrl: true,
      updatedAt: true,
      sanitaryInfo: {
        select: {
          legalDenomination: true,
          allergens: true,
          conservationType: true,
          saleFormat: true,
          defaultWeight: true,
          requiresCooking: true,
        },
      },
    },
  });

  return NextResponse.json({
    locationId: auth.locationId,
    count: products.length,
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      // Categoría de la TIENDA (onlineCategory) con fallback a la interna.
      category: p.onlineCategory ?? p.category,
      // Descripción comercial con fallback a la genérica de la ficha.
      description: p.onlineDescription ?? p.description ?? null,
      price: p.salePrice,
      imageUrl: p.onlineImageUrl ?? null,
      // Datos legales reutilizados de la ficha sanitaria.
      legalDenomination: p.sanitaryInfo?.legalDenomination ?? null,
      allergens: p.sanitaryInfo?.allergens ?? null,
      conservation: p.sanitaryInfo?.conservationType ?? null,
      saleFormat: p.sanitaryInfo?.saleFormat ?? null,
      defaultWeight: p.sanitaryInfo?.defaultWeight ?? null,
      requiresCooking: p.sanitaryInfo?.requiresCooking ?? null,
      updatedAt: p.updatedAt.toISOString(),
    })),
  });
}
