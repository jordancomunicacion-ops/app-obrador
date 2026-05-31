import { notFound } from 'next/navigation';
import { prisma } from '@/app/lib/prisma';
import { locationScope } from '@/app/lib/auth/scope';
import ObradorProductForm from '@/app/ui/obrador/product-form';
import { updateObradorProduct } from '@/app/lib/actions/obrador-products';

export default async function EditObradorProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.masterProduct.findFirst({
    where: { id, isObrador: true, ...(await locationScope()) },
    include: { sanitaryInfo: true },
  });

  if (!product) notFound();

  const updateWithId = updateObradorProduct.bind(null, product.id);

  return <ObradorProductForm action={updateWithId} initial={product} />;
}
