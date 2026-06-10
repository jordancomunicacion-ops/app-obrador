import SupplierForm from '@/app/ui/suppliers/supplier-form';
import { createSupplier } from '@/app/lib/actions/suppliers';

export default async function CreateSupplierPage({
  searchParams,
}: {
  searchParams: Promise<{ locationId?: string }>;
}) {
  const { locationId } = await searchParams;
  const returnTo = locationId
    ? `/dashboard/settings/locations/${locationId}?tab=proveedores`
    : undefined;
  return <SupplierForm action={createSupplier} locationId={locationId} returnTo={returnTo} />;
}
