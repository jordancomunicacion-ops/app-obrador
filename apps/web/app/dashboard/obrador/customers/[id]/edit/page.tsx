import { notFound } from 'next/navigation';
import { prisma } from '@/app/lib/prisma';
import { locationScope } from '@/app/lib/auth/scope';
import ObradorCustomerForm from '@/app/ui/obrador/customer-form';
import { updateObradorCustomer } from '@/app/lib/actions/obrador-customers';

export default async function EditObradorCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id, ...(await locationScope()) },
  });

  if (!customer) notFound();

  const updateWithId = updateObradorCustomer.bind(null, customer.id);

  return <ObradorCustomerForm action={updateWithId} initial={customer} />;
}
