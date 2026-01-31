import { UpdateRecipe, DeleteRecipe } from '@/app/ui/recipes/buttons';
import { prisma } from '@/lib/prisma';
import { formatUnit } from '@/app/lib/units';
import { calculateRecipeCost, formatCurrency } from '@/app/lib/costing';

export default async function RecipesTable({
    query,
    currentPage,
    categoryFilter,
}: {
    query: string;
    currentPage: number;
    categoryFilter?: string;
}) {
    const recipes = await prisma.recipe.findMany({
        where: {
            AND: [
                { name: { contains: query } },
                categoryFilter && categoryFilter !== 'ALL'
                    ? { category: categoryFilter }
                    : {}
            ]
        },
        orderBy: { name: 'asc' },
        include: {
            items: {
                include: {
                    ingredient: true,
                    sourceProduct: true,
                    subRecipe: {
                        include: {
                            items: {
                                include: {
                                    ingredient: true,
                                    sourceProduct: true
                                }
                            }
                        }
                    }
                }
            }
        },
    });

    return (
        <div className="mt-6 flow-root">
            <div className="inline-block min-w-full align-middle">
                <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
                    <table className="hidden min-w-full text-gray-900 md:table">
                        <thead className="rounded-lg text-left text-sm font-normal">
                            <tr>
                                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                                    Nombre
                                </th>
                                <th scope="col" className="px-3 py-5 font-medium">
                                    Tipo
                                </th>
                                <th scope="col" className="px-3 py-5 font-medium">
                                    Coste Total
                                </th>
                                <th scope="col" className="px-3 py-5 font-medium">
                                    Coste / Unidad
                                </th>
                                <th scope="col" className="px-3 py-5 font-medium">
                                    Ingredientes
                                </th>
                                <th scope="col" className="relative py-3 pl-6 pr-3">
                                    <span className="sr-only">Edit</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {recipes.map((recipe: any) => {
                                const totalCost = calculateRecipeCost(recipe);
                                // Cost per portion (if portions exist) otherwise cost of the whole recipe
                                const costPerUnit = recipe.portions && recipe.portions > 0
                                    ? totalCost / recipe.portions
                                    : totalCost;

                                return (
                                    <tr
                                        key={recipe.id}
                                        className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                                    >
                                        <td className="whitespace-nowrap py-3 pl-6 pr-3">
                                            <div className="flex flex-col">
                                                <p className="font-medium text-gray-900">{recipe.name}</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {recipe.isGlutenFree && (
                                                        <span className="inline-flex items-center rounded-md bg-yellow-50 px-1.5 py-0.5 text-[10px] font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20" title="Sin Gluten">
                                                            🌾 SG
                                                        </span>
                                                    )}
                                                    {recipe.isVegan && (
                                                        <span className="inline-flex items-center rounded-md bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20" title="Vegano">
                                                            🌱 Vg
                                                        </span>
                                                    )}
                                                    {recipe.isVegetarian && (
                                                        <span className="inline-flex items-center rounded-md bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/10" title="Vegetariano">
                                                            🥗 Vt
                                                        </span>
                                                    )}
                                                    {recipe.isLactoseFree && (
                                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10" title="Sin Lactosa">
                                                            🥛 SL
                                                        </span>
                                                    )}
                                                    {recipe.allergens && (
                                                        <span className="inline-flex items-center rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-700 ring-1 ring-inset ring-red-600/10" title={recipe.allergens}>
                                                            ⚠️ Alérgenos
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3">
                                            {recipe.category === 'PRODUCTO_NO_ELABORADO' && (
                                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                                                    Producto
                                                </span>
                                            )}
                                            {recipe.category === 'ELABORACION_INTERMEDIA' && (
                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                                                    Intermedia
                                                </span>
                                            )}
                                            {recipe.category === 'ELABORACION_FINAL' && (
                                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                                                    Final
                                                </span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3 font-semibold text-gray-700">
                                            {formatCurrency(totalCost)}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3 text-green-600 font-bold">
                                            {formatCurrency(costPerUnit)}
                                            {recipe.portions && recipe.portions > 0 && (
                                                <span className="text-xs text-gray-500 ml-1">/ ración</span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-3">
                                            {recipe.items?.length || 0} items
                                        </td>
                                        <td className="whitespace-nowrap py-3 pl-6 pr-3">
                                            <div className="flex justify-end gap-3">
                                                <UpdateRecipe id={recipe.id} />
                                                <DeleteRecipe id={recipe.id} />
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
