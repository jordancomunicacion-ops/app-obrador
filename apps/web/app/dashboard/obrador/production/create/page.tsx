import { prisma } from '@/app/lib/prisma';
import { locationScope } from '@/app/lib/auth/scope';
import ObradorProductionForm from '@/app/ui/obrador/production-form';

export default async function CreateObradorProductionPage() {
  const products = await prisma.masterProduct.findMany({
    where: { isObrador: true, ...(await locationScope()) },
    include: { sanitaryInfo: { select: { shelfLifeDays: true } } },
    orderBy: { name: 'asc' },
  });

  const options = products.map((p) => ({
    id: p.id,
    name: p.name,
    shelfLifeDays: p.sanitaryInfo?.shelfLifeDays ?? null,
  }));

  return <ObradorProductionForm products={options} />;
}
