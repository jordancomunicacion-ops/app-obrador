import { notFound } from 'next/navigation';
import { prisma } from '@/app/lib/prisma';
import { locationScope } from '@/app/lib/auth/scope';
import ObradorSupplierForm from '@/app/ui/obrador/supplier-form';
import { updateObradorSupplier } from '@/app/lib/actions/obrador-suppliers';

export default async function EditObradorSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supplier = await prisma.supplier.findFirst({
    where: { id, ...(await locationScope()) },
  });

  if (!supplier) notFound();

  const updateWithId = updateObradorSupplier.bind(null, supplier.id);

  return <ObradorSupplierForm action={updateWithId} initial={supplier} />;
}
