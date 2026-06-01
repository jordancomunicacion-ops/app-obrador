import { redirect } from 'next/navigation';

// El etiquetado de obrador se unificó en la sección "Etiquetas" (pestaña Venta).
// Esta ruta se mantiene por compatibilidad y redirige al flujo unificado,
// conservando el lote si venía indicado.
export default async function ObradorLabelingPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ batchId?: string }>;
}) {
  const { batchId } = await searchParams;
  redirect(
    `/dashboard/today/labels?destination=sale${batchId ? `&batchId=${batchId}` : ''}`,
  );
}
