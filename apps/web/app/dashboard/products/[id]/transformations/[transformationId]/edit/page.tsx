
import { prisma } from '@/app/lib/prisma';
import { notFound } from 'next/navigation';
import EditTransformationForm from '@/app/ui/transformations/edit-form';
import { locationScope } from '@/app/lib/auth/scope';

export default async function Page({ params }: { params: { id: string, transformationId: string } }) {
    const { id, transformationId } = await params;
    const scope = await locationScope();

    const [product, transformation, ingredients] = await Promise.all([
        prisma.masterProduct.findFirst({
            where: { ...scope, id },
            include: { supplierProducts: true }
        }),
        prisma.transformation.findUnique({
            where: { id: transformationId },
            include: {
                outputs: {
                    include: { ingredient: true }
                }
            }
        }),
        prisma.ingredient.findMany({
            where: { ...scope },
            orderBy: { name: 'asc' },
            include: {
                transformationOutputs: {
                    include: {
                        transformation: {
                            include: {
                                sourceProduct: true
                            }
                        }
                    }
                }
            }
        })
    ]);

    if (!product || !transformation) {
        notFound();
    }

    return (
        <main>
            <h1 className="mb-4 text-2xl font-bold">Editar Transformación: {product.name}</h1>
            <EditTransformationForm
                product={product}
                transformation={transformation}
                ingredients={ingredients}
            />
        </main>
    );
}
