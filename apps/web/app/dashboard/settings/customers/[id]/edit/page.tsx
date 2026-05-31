import { notFound } from 'next/navigation';
import { prisma } from '@/app/lib/prisma';
import { locationScope } from '@/app/lib/auth/scope';
import CustomerForm from '@/app/ui/customers/customer-form';
import { updateCustomer } from '@/app/lib/actions/customers';

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id, ...(await locationScope()) },
  });

  if (!customer) notFound();

  const updateWithId = updateCustomer.bind(null, customer.id);

  return <CustomerForm action={updateWithId} initial={customer} />;
}
