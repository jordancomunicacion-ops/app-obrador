import { notFound } from 'next/navigation';
import { prisma } from '@/app/lib/prisma';
import { locationScope } from '@/app/lib/auth/scope';
import SupplierForm from '@/app/ui/suppliers/supplier-form';
import { updateSupplier } from '@/app/lib/actions/suppliers';

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supplier = await prisma.supplier.findFirst({
    where: { id, ...(await locationScope()) },
  });

  if (!supplier) notFound();

  const updateWithId = updateSupplier.bind(null, supplier.id);

  return <SupplierForm action={updateWithId} initial={supplier} />;
}
