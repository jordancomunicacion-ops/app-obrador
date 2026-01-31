
import EditForm from '@/app/ui/products/edit-form';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function Page({ params }: { params: { id: string } }) {
    const { id } = await params;

    const product = await prisma.masterProduct.findUnique({
        where: { id },
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
