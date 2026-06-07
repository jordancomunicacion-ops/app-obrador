
import EditForm from '@/app/ui/products/edit-form';
import PackagedProductForm from '@/app/ui/products/packaged-form';
import VentaWebSection from '@/app/ui/ecommerce/venta-web-section';
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

    // Datos de venta web (común a ambos tipos de producto).
    const ventaWeb = {
        id: product.id,
        name: product.name,
        description: product.description,
        isSellableOnline: product.isSellableOnline,
        salePrice: product.salePrice,
        onlineDescription: product.onlineDescription,
        onlineImageUrl: product.onlineImageUrl,
        onlineCategory: product.onlineCategory,
    };

    // Producto envasado del obrador: ficha sanitaria. Resto: variantes de proveedor.
    if (product.isObrador) {
        const updateWithId = updatePackagedProduct.bind(null, product.id);
        return (
            <main>
                <PackagedProductForm action={updateWithId} initial={product} />
                <VentaWebSection product={ventaWeb} />
            </main>
        );
    }

    return (
        <main>
            <h1 className="mb-4 text-2xl font-bold">Editar Producto</h1>
            <EditForm product={product} />
            <VentaWebSection product={ventaWeb} />
        </main>
    );
}
