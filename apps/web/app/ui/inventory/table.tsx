import { UpdateIngredient, DeleteIngredient } from '@/app/ui/inventory/buttons';
import { prisma } from '@/lib/prisma';
import { locationScope } from '@/lib/auth/scope';

export default async function InventoryTable({
    query,
    currentPage,
}: {
    query: string;
    currentPage: number;
}) {
    const ingredients = await prisma.ingredient.findMany({
        where: {
            ...(await locationScope()),
            OR: [
                { name: { contains: query } }, // Case insensitive in Postgres, sensitive in SQLite/some providers. 
                // For SQLite "contains" maps to LIKE which is case insensitive for ASCII
                // but might be sensitive for unicode.
                { category: { contains: query } },
            ],
        },
        orderBy: { name: 'asc' },
        // Pagination logic could go here (take/skip)
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
                                    Categoría
                                </th>
                                <th scope="col" className="px-3 py-5 font-medium">
                                    Precio / Unidad
                                </th>
                                <th scope="col" className="px-3 py-5 font-medium">
                                    Rendimiento
                                </th>
                                <th scope="col" className="relative py-3 pl-6 pr-3">
                                    <span className="sr-only">Edit</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {ingredients.map((ingredient: any) => ( // Using any for MVP speed or import Ingredient type
                                <tr
                                    key={ingredient.id}
                                    className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                                >
                                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                                        <div className="flex items-center gap-3">
                                            <p>{ingredient.name}</p>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-3">
                                        {ingredient.category || '-'}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-3">
                                        {ingredient.pricePerUnit} € / {ingredient.pricingUnit}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-3">
                                        {ingredient.yieldPercent}%
                                    </td>
                                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                                        <div className="flex justify-end gap-3">
                                            <UpdateIngredient id={ingredient.id} />
                                            <DeleteIngredient id={ingredient.id} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
