import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DeleteTransformationButton } from '@/app/ui/products/delete-transformation-button';
import { PencilIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default async function Page({ params }: { params: { id: string } }) {
    const { id } = await params;

    const product = await prisma.masterProduct.findUnique({
        where: { id },
        include: {
            supplierProducts: {
                include: {
                    transformations: {
                        include: {
                            outputs: {
                                include: {
                                    ingredient: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!product) {
        notFound();
    }

    // Flatten all transformations from all suppliers
    const allTransformations = product.supplierProducts.flatMap(sp =>
        sp.transformations.map(t => ({
            ...t,
            supplierName: sp.supplier,
            supplierPrice: sp.price,
            supplierUnit: sp.unit
        }))
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return (
        <main className="w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">
                            {product.category || 'Sin Categoría'}
                        </span>
                        <span>•</span>
                        <span>{product.supplierProducts.length} {product.supplierProducts.length === 1 ? 'Proveedor' : 'Proveedores'}</span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/dashboard/products"
                        className="rounded-lg bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 shadow-sm"
                    >
                        Volver
                    </Link>
                    <Link
                        href={`/dashboard/products/${product.id}/edit`}
                        className="rounded-lg bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-gray-50 shadow-sm"
                    >
                        Editar Producto
                    </Link>
                    <Link
                        href={`/dashboard/products/${product.id}/transformations/create`}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 shadow-sm"
                    >
                        + Nuevo Test de Rendimiento
                    </Link>
                </div>
            </div>

            {/* Suppliers Grid */}
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="bg-blue-600 w-1 h-6 rounded-full inline-block"></span>
                Precios por Proveedor
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {product.supplierProducts.map((sp) => (
                    <div key={sp.id} className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-800">{sp.supplier}</h3>
                            <span className="text-[10px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                {sp.sapiensWorld}
                            </span>
                        </div>
                        <p className="text-2xl font-black text-blue-700">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(sp.price)}
                            <span className="text-sm font-normal text-gray-400"> / {sp.unit}</span>
                        </p>
                        {sp.quantityPerUnit && (
                            <p className="text-xs text-gray-400 mt-1">
                                Formato: {sp.quantityPerUnit} uds/{sp.unit}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* Transformations / Yield Tests */}
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="bg-emerald-500 w-1 h-6 rounded-full inline-block"></span>
                Tests de Rendimiento (Historial)
            </h2>

            {allTransformations.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-12 text-center text-gray-500 border-2 border-dashed border-gray-200">
                    <p className="text-lg">No se han realizado tests de rendimiento.</p>
                    <Link
                        href={`/dashboard/products/${product.id}/transformations/create`}
                        className="text-blue-600 font-medium hover:underline mt-2 inline-block"
                    >
                        Realizar el primer test ahora →
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {allTransformations.map((trans) => (
                        <div key={trans.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{trans.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        Test realizado con <span className="font-semibold text-gray-700">{trans.supplierName}</span> el {trans.createdAt.toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {(() => {
                                        const sixMonthsAgo = new Date();
                                        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                                        if (new Date(trans.createdAt) < sixMonthsAgo) {
                                            return (
                                                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200" title="Se recomienda revisar este test cada 6 meses">
                                                    <ExclamationTriangleIcon className="w-3 h-3" />
                                                    Revisar
                                                </span>
                                            );
                                        }
                                        return null;
                                    })()}
                                    <div className="flex items-center gap-2 bg-white p-1 rounded-md border border-gray-100 shadow-sm">
                                        <Link
                                            href={`/dashboard/products/${product.id}/transformations/${trans.id}/edit`}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                                            title="Editar"
                                        >
                                            <PencilIcon className="w-5 h-5" />
                                        </Link>
                                        <DeleteTransformationButton
                                            transformationId={trans.id}
                                            productId={product.id}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <table className="min-w-full text-sm text-left">
                                    <thead className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider border-b border-gray-100">
                                        <tr>
                                            <th className="pb-3 px-2">Ingrediente Generado</th>
                                            <th className="pb-3 px-2 text-right">Rendimiento %</th>
                                            <th className="pb-3 px-2 text-right">Factor Coste</th>
                                            <th className="pb-3 px-2 text-right">Coste Derivado Estimado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {trans.outputs.map((output) => {
                                            // Cost Calculation Logic
                                            const totalInputCost = trans.supplierPrice * trans.testQuantity;
                                            const totalWeightedOutput = trans.outputs.reduce(
                                                (sum, o) => sum + (o.weight * o.costAllocation),
                                                0
                                            );

                                            let derivedCostPerUnit = null;
                                            if (totalWeightedOutput > 0 && output.weight > 0) {
                                                const allocatedCost = (totalInputCost * output.weight * output.costAllocation) / totalWeightedOutput;
                                                derivedCostPerUnit = allocatedCost / output.weight;
                                            }

                                            return (
                                                <tr key={output.id} className="group hover:bg-gray-50 transition-colors">
                                                    <td className="py-3 px-2 font-semibold text-gray-800">
                                                        {output.ingredient.name}
                                                    </td>
                                                    <td className="py-3 px-2 text-right">
                                                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded text-xs">
                                                            {output.percentage.toFixed(1)}%
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-2 text-right text-gray-500">
                                                        x{output.costAllocation}
                                                    </td>
                                                    <td className="py-3 px-2 text-right font-bold text-gray-900">
                                                        {derivedCostPerUnit !== null ? (
                                                            <>
                                                                {new Intl.NumberFormat('es-ES', {
                                                                    style: 'currency',
                                                                    currency: 'EUR',
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2
                                                                }).format(derivedCostPerUnit)}
                                                                <span className="text-[10px] text-gray-400 font-normal ml-1">/{trans.supplierUnit}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
