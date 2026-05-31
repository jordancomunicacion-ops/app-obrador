import { prisma } from '@/app/lib/prisma';
import TransformationForm from '@/app/ui/transformations/create-form';
import { notFound } from 'next/navigation';
import { locationScope } from '@/app/lib/auth/scope';

export default async function Page({ params }: { params: { id: string } }) {
    const { id } = await params;
    const scope = await locationScope();

    const [product, ingredients] = await Promise.all([
        prisma.masterProduct.findFirst({
            where: { ...scope, id },
            include: { supplierProducts: true }
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
        }),
    ]);

    if (!product) {
        notFound();
    }

    return (
        <main>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Elaboración intermedia</h1>
                <p className="text-gray-600">Definiendo reglas para: <span className="font-semibold">{product.name}</span></p>
            </div>

            <TransformationForm product={product} ingredients={ingredients} />
        </main>
    );
}
