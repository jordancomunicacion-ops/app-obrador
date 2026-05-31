import { prisma } from '@/app/lib/prisma';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';
import { DeleteProduct } from '@/app/ui/products/buttons';
import { locationScope } from '@/app/lib/auth/scope';

export default async function Page() {
    const products = await prisma.masterProduct.findMany({
        where: { ...(await locationScope()) },
        include: {
            supplierProducts: {
                orderBy: { price: 'asc' }
            },
        },
        orderBy: { name: 'asc' },
    });

    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">Gestión de Productos</h1>
                <Link
                    href="/dashboard/products/create"
                    className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Añadir Producto
                </Link>
            </div>

            <div className="mt-6 flow-root">
                <div className="inline-block min-w-full align-middle">
                    <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
                        <table className="min-w-full text-gray-900">
                            <thead className="rounded-lg text-left text-sm font-normal">
                                <tr>
                                    <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                                        Producto
                                    </th>
                                    <th scope="col" className="px-3 py-5 font-medium">
                                        Categoría
                                    </th>
                                    <th scope="col" className="px-3 py-5 font-medium">
                                        Proveedores
                                    </th>
                                    <th scope="col" className="px-3 py-5 font-medium">
                                        Precio (desde)
                                    </th>
                                    <th scope="col" className="relative py-3 pl-6 pr-3">
                                        <span className="sr-only">Acciones</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {products.map((product) => {
                                    const minPrice = product.supplierProducts.length > 0
                                        ? Math.min(...product.supplierProducts.map(sp => sp.price))
                                        : null;
                                    const bestUnit = product.supplierProducts.find(sp => sp.price === minPrice)?.unit;

                                    return (
                                        <tr
                                            key={product.id}
                                            className="w-full border-b py-3 text-sm last-of-type:border-none hover:bg-gray-50"
                                        >
                                            <td className="whitespace-nowrap py-3 pl-6 pr-3">
                                                <div className="flex items-center gap-3">
                                                    <p className="font-semibold text-blue-700">{product.name}</p>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3">
                                                {product.category || '-'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{product.supplierProducts.length} {product.supplierProducts.length === 1 ? 'Proveedor' : 'Proveedores'}</span>
                                                    <span className="text-xs text-gray-500 truncate max-w-[200px]">
                                                        {product.supplierProducts.map(sp => sp.supplier).join(', ')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-3">
                                                {minPrice !== null ? (
                                                    <>
                                                        <span className="font-semibold">{new Intl.NumberFormat('es-ES', {
                                                            style: 'currency',
                                                            currency: 'EUR',
                                                        }).format(minPrice)}</span>
                                                        <span className="text-gray-500 font-normal"> / {bestUnit}</span>
                                                    </>
                                                ) : '-'}
                                            </td>
                                            <td className="whitespace-nowrap py-3 pl-6 pr-3">
                                                <div className="flex justify-end gap-3">
                                                    <Link
                                                        href={`/dashboard/products/${product.id}`}
                                                        className="rounded-md border p-2 text-sm font-medium hover:bg-gray-100"
                                                    >
                                                        Ver Detalle
                                                    </Link>
                                                    <Link
                                                        href={`/dashboard/products/${product.id}/edit`}
                                                        className="rounded-md border p-2 text-sm font-medium hover:bg-gray-100"
                                                    >
                                                        Editar
                                                    </Link>
                                                    <DeleteProduct id={product.id} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div >
    );
}
