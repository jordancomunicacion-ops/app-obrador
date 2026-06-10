import CustomerForm from '@/app/ui/customers/customer-form';
import { createCustomer } from '@/app/lib/actions/customers';

export default async function CreateCustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ locationId?: string }>;
}) {
  const { locationId } = await searchParams;
  const returnTo = locationId
    ? `/dashboard/settings/locations/${locationId}?tab=clientes`
    : undefined;
  return <CustomerForm action={createCustomer} locationId={locationId} returnTo={returnTo} />;
}
