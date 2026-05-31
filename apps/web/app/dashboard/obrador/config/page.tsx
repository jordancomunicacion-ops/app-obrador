import { prisma } from '@/app/lib/prisma';
import ObradorConfigForm from '@/app/ui/obrador/config-form';

export default async function ObradorConfigPage() {
  const config = await prisma.obradorConfig.findUnique({ where: { id: 'default' } });
  return <ObradorConfigForm initial={config} />;
}
