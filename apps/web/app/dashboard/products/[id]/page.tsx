import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DeleteTransformationButton } from '@/app/ui/products/delete-transformation-button';
import { PencilIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default async function Page({ params }: { params: { id: string } }) {
    const { id } = await params;

    const product = await prisma.supplierProduct.findUnique({
        where: { id },
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
    });

    if (!product) {
        notFound();
    }

    return (
        <main className="w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">{product.name}</h1>
                    <div className="text-gray-500 flex flex-col md:flex-row gap-2 md:gap-4">
                        <p>Proveedor: {product.supplier || 'N/D'}</p>
                        {product.sapiensWorld && (
                            <p className="hidden md:block">|</p>
                        )}
                        {product.sapiensWorld && (
                            <p>Mundo: <span className="font-semibold text-blue-600">{product.sapiensWorld}</span></p>
                        )}
                    </div>
                </div>
                <div className="flex gap-4">
                    <Link
                        href="/dashboard/products"
                        className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
                    >
                        Volver
                    </Link>
                    <Link
                        href={`/dashboard/products/${product.id}/transformations/create`}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                    >
                        + Nuevo Test de Rendimiento
                    </Link>
                </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Precio Compra</h3>
                    <p className="text-2xl font-bold">
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(product.price)}
                        <span className="text-base font-normal text-gray-400"> / {product.unit}</span>
                    </p>
                </div>
                {/* Stats placeholders could go here */}
            </div>

            {/* Transformations / Yield Tests */}
            <h2 className="text-xl font-bold mb-4">Elaboraciones Intermedias</h2>

            {product.transformations.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                    <p>No se han realizado tests de rendimiento para este producto.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {product.transformations.map((trans) => (
                        <div key={trans.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="font-bold text-gray-800">{trans.name}</h3>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">
                                            {trans.createdAt.toLocaleDateString()}
                                        </span>
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
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/dashboard/products/${product.id}/transformations/${trans.id}/edit`}
                                            className="text-blue-600 hover:text-blue-800"
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
                                    <thead className="text-gray-500 font-medium border-b border-gray-100">
                                        <tr>
                                            <th className="pb-2">Ingrediente Generado</th>
                                            <th className="pb-2 text-right">Rendimiento %</th>
                                            <th className="pb-2 text-right">Factor Coste</th>
                                            <th className="pb-2 text-right">Coste Derivado Estimado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {trans.outputs.map((output) => {
                                            // Calculate Derived Cost per Unit
                                            // Step 1: Calculate total input cost
                                            const totalInputCost = product.price * trans.testQuantity;

                                            // Step 2: Calculate total weighted output (sum of weight * costAllocation for all outputs)
                                            const totalWeightedOutput = trans.outputs.reduce(
                                                (sum, o) => sum + (o.weight * o.costAllocation),
                                                0
                                            );

                                            // Step 3: Distribute cost to this output proportionally
                                            // Cost allocated to this output = (totalInputCost * thisWeight * thisCostFactor) / totalWeightedOutput
                                            let derivedCostPerUnit = null;
                                            if (totalWeightedOutput > 0 && output.weight > 0) {
                                                const allocatedCost = (totalInputCost * output.weight * output.costAllocation) / totalWeightedOutput;
                                                derivedCostPerUnit = allocatedCost / output.weight;
                                            }

                                            return (
                                                <tr key={output.id} className="group">
                                                    <td className="py-2 font-medium text-gray-800">
                                                        {output.ingredient.name}
                                                    </td>
                                                    <td className="py-2 text-right">
                                                        {output.percentage.toFixed(1)}%
                                                    </td>
                                                    <td className="py-2 text-right">
                                                        x{output.costAllocation}
                                                    </td>
                                                    <td className="py-2 text-right font-medium text-gray-700">
                                                        {derivedCostPerUnit !== null ? (
                                                            <>
                                                                {new Intl.NumberFormat('es-ES', {
                                                                    style: 'currency',
                                                                    currency: 'EUR',
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2
                                                                }).format(derivedCostPerUnit)}
                                                                <span className="text-xs text-gray-400 ml-1">/{product.unit}</span>
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
