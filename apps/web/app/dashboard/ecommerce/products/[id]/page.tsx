import { notFound } from 'next/navigation';
import { prisma } from '@/app/lib/prisma';
import { locationScope } from '@/app/lib/auth/scope';
import OnlineSaleForm from '@/app/ui/ecommerce/online-sale-form';

export default async function EditOnlineSalePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const product = await prisma.masterProduct.findFirst({
    where: { id, ...(await locationScope()) },
    select: {
      id: true,
      name: true,
      category: true,
      description: true,
      isSellableOnline: true,
      salePrice: true,
      onlineDescription: true,
      onlineImageUrl: true,
      sanitaryInfo: { select: { legalDenomination: true, allergens: true } },
    },
  });

  if (!product) notFound();

  return (
    <OnlineSaleForm
      initial={{
        id: product.id,
        name: product.name,
        category: product.category,
        description: product.description,
        isSellableOnline: product.isSellableOnline,
        salePrice: product.salePrice,
        onlineDescription: product.onlineDescription,
        onlineImageUrl: product.onlineImageUrl,
        legalDenomination: product.sanitaryInfo?.legalDenomination ?? null,
        allergens: product.sanitaryInfo?.allergens ?? null,
      }}
    />
  );
}
