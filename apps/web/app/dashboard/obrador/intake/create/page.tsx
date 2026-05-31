import { prisma } from '@/app/lib/prisma';
import { locationScope } from '@/app/lib/auth/scope';
import ObradorIntakeForm from '@/app/ui/obrador/intake-form';

export default async function CreateObradorIntakePage() {
  const suppliers = await prisma.supplier.findMany({
    where: { ...(await locationScope()) },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  return <ObradorIntakeForm suppliers={suppliers} />;
}
