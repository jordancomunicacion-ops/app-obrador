
import EditForm from '@/app/ui/products/edit-form';
import PackagedProductForm from '@/app/ui/products/packaged-form';
import { updatePackagedProduct } from '@/app/lib/actions/packaged-products';
import { prisma } from '@/app/lib/prisma';
import { notFound } from 'next/navigation';
import { locationScope } from '@/app/lib/auth/scope';

export default async function Page({ params }: { params: { id: string } }) {
    const { id } = await params;

    const product = await prisma.masterProduct.findFirst({
        where: { ...(await locationScope()), id },
        include: { supplierProducts: true, sanitaryInfo: true }
    });

    if (!product) {
        notFound();
    }

    // Producto envasado del obrador: ficha sanitaria. Resto: variantes de proveedor.
    if (product.isObrador) {
        const updateWithId = updatePackagedProduct.bind(null, product.id);
        return <PackagedProductForm action={updateWithId} initial={product} />;
    }

    return (
        <main>
            <h1 className="mb-4 text-2xl font-bold">Editar Producto</h1>
            <EditForm product={product} />
        </main>
    );
}
