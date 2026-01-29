import Form from '@/app/ui/recipes/create-form';
import { prisma } from '@/lib/prisma';
import { HomeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default async function Page() {
    const [ingredientsRaw, categories, packaging, subRecipes, transformedProducts] = await Promise.all([
        prisma.ingredient.findMany({
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
                },
                supplierProducts: {
                    include: {
                        supplierEntity: true
                    }
                }
            }
        }),
        prisma.recipeCategory.findMany({ orderBy: { name: 'asc' } }),
        prisma.recipePackaging.findMany({ orderBy: { name: 'asc' } }),
        prisma.recipe.findMany({
            where: {
                category: {
                    in: ['ELABORACION_INTERMEDIA', 'PRODUCTO_NO_ELABORADO']
                }
            },
            orderBy: { name: 'asc' }
        }),
        prisma.supplierProduct.findMany({
            where: {
                transformations: { some: {} }
            },
            select: { name: true }
        })
    ]);

    // Filter out ingredients that correspond to products with active transformations (yield tests)
    const excludedNames = new Set(transformedProducts.map(p => p.name));
    const ingredients = ingredientsRaw.filter(i => !excludedNames.has(i.name));

    return (
        <main>
            <div className="flex w-full items-center justify-between">
                <nav className="flex" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-4">
                        <li>
                            <div>
                                <Link href="/dashboard" className="text-gray-400 hover:text-gray-500">
                                    <HomeIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                                    <span className="sr-only">Home</span>
                                </Link>
                            </div>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <span className="text-gray-300">/</span>
                                <Link href="/dashboard/recipes" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                                    Recetas
                                </Link>
                            </div>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <span className="text-gray-300">/</span>
                                <span className="ml-4 text-sm font-medium text-gray-500" aria-current="page">Crear</span>
                            </div>
                        </li>
                    </ol>
                </nav>
            </div>
            <h1 className="my-8 text-2xl font-bold">Crear Nueva Receta</h1>
            <Form
                ingredients={ingredients}
                categories={categories}
                packaging={packaging}
                availableSubRecipes={subRecipes}
            />
        </main>
    );
}
