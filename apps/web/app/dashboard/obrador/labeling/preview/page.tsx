import { prisma } from '@/app/lib/prisma';
import { auth } from '@/auth';
import LabelPreview, { type LabelData } from '@/app/ui/obrador/label-preview';

function fmtDate(d: Date | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default async function LabelPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ batchId?: string }>;
}) {
  const { batchId } = await searchParams;
  const session = await auth();
  const ownerId = session?.user?.id ?? '__none__';

  const [batch, config] = await Promise.all([
    batchId
      ? prisma.obradorProductionBatch.findFirst({
          where: { id: batchId, ownerId },
          include: { masterProduct: { include: { sanitaryInfo: true, location: true } } },
        })
      : null,
    prisma.obradorConfig.findUnique({ where: { id: 'default' } }),
  ]);

  const product = batch?.masterProduct ?? null;
  const sanitary = product?.sanitaryInfo ?? null;
  const allergens = sanitary?.allergens
    ? sanitary.allergens.split(',').map((a) => a.trim()).filter(Boolean)
    : [];

  // El operador/registro/origen salen del local del producto; si aún no se han
  // rellenado en Locales, se usa el antiguo ObradorConfig como respaldo.
  const loc = product?.location ?? null;
  const opName = loc?.companyName ?? loc?.name ?? config?.businessName ?? config?.companyName ?? null;
  const opAddr = loc?.address ?? config?.address ?? null;
  const operatorParts = [opName, opAddr].filter(Boolean);

  const data: LabelData = {
    name: product?.name ?? 'Producto sin asignar',
    denomination: sanitary?.legalDenomination ?? '',
    ingredients: sanitary?.ingredientsList ?? 'Sin composición declarada.',
    allergens,
    netWeight: sanitary?.defaultWeight != null ? `${sanitary.defaultWeight} g` : '—',
    expiry: fmtDate(batch?.expiryDate),
    batch: batch?.batchCode ?? '—',
    conservation:
      sanitary?.conservationType ??
      (sanitary?.recommendedTemp ? `Conservar a ${sanitary.recommendedTemp}` : ''),
    operator: operatorParts.length > 0 ? operatorParts.join(' · ') : 'Obrador (configura los datos del local en Locales)',
    registry: loc?.registryNumber ?? config?.registryNumber ?? '',
    origin: loc?.region ?? config?.region ?? 'España',
    modeOfUse:
      sanitary?.usageInstructions ??
      (sanitary?.requiresCooking ? 'Cocinar completamente antes de consumir.' : 'Listo para consumo.'),
  };

  return (
    <>
      {!batch && (
        <div className="max-w-6xl mx-auto px-6 pt-6 print:hidden">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
            Vista de ejemplo: abre esta página desde un lote (botón de etiqueta en{' '}
            <span className="font-semibold">Producción</span>) para ver sus datos reales.
          </div>
        </div>
      )}
      <LabelPreview data={data} />
    </>
  );
}
