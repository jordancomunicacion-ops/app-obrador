import ObradorDocumentForm from '@/app/ui/obrador/document-form';

export default async function CreateObradorDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ locationId?: string }>;
}) {
  const { locationId } = await searchParams;
  const returnTo = locationId
    ? `/dashboard/settings/locations/${locationId}?tab=documentos`
    : undefined;
  return <ObradorDocumentForm locationId={locationId} returnTo={returnTo} />;
}
