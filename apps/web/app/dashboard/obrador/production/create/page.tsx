import { prisma } from '@/app/lib/prisma';
import { locationScope } from '@/app/lib/auth/scope';
import ObradorProductionForm from '@/app/ui/obrador/production-form';

export default async function CreateObradorProductionPage() {
  const scope = await locationScope();

  const [masterProducts, customers] = await Promise.all([
    prisma.masterProduct.findMany({
      where: { isObrador: true, ...scope },
      include: { sanitaryInfo: { select: { shelfLifeDays: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.customer.findMany({
      where: { ...scope },
      select: { id: true, name: true, customerType: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const options = masterProducts.map((p) => ({
    id: p.id,
    name: p.name,
    shelfLifeDays: p.sanitaryInfo?.shelfLifeDays ?? null,
  }));

  return <ObradorProductionForm products={options} customers={customers} />;
}
