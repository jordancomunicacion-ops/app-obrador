import { prisma } from '@/app/lib/prisma';
import { locationScope } from '@/app/lib/auth/scope';
import ObradorIntakeForm from '@/app/ui/obrador/intake-form';

export default async function CreateObradorIntakePage() {
  const scope = await locationScope();
  const [suppliers, products] = await Promise.all([
    prisma.supplier.findMany({
      where: { ...scope },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    // Ficha única: productos del catálogo marcados como de obrador (Frente A).
    prisma.masterProduct.findMany({
      where: { ...scope, isObrador: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return <ObradorIntakeForm suppliers={suppliers} products={products} />;
}
