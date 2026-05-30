
import EditForm from '@/app/ui/products/edit-form';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { locationScope } from '@/lib/auth/scope';

export default async function Page({ params }: { params: { id: string } }) {
    const { id } = await params;

    const product = await prisma.masterProduct.findFirst({
        where: { ...(await locationScope()), id },
        include: { supplierProducts: true }
    });

    if (!product) {
        notFound();
    }

    return (
        <main>
            <h1 className="mb-4 text-2xl font-bold">Editar Producto</h1>
            <EditForm product={product} />
        </main>
    );
}
