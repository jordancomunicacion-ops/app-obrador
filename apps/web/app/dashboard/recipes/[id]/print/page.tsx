import { prisma } from '@/app/lib/prisma';
import { notFound } from 'next/navigation';
import { Ingredient, RecipeItem, RecipeStep } from '@prisma/client';
import { locationScope } from '@/app/lib/auth/scope';
import PrintButton from '@/app/ui/recipes/print-button';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const recipe = await prisma.recipe.findFirst({
        where: { ...(await locationScope()), id },
        include: {
            items: {
                include: { ingredient: true, subRecipe: true }
            },
            steps: {
                orderBy: { order: 'asc' }
            }
        },
    });

    if (!recipe) {
        notFound();
    }

    // Helper to format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    return (
        <main className="min-h-screen bg-white text-black p-8 print:p-0">
            {/* Print Button (Hidden in Print) */}
            <div className="mb-4 print:hidden flex justify-end">
                <PrintButton />
            </div>

            <div className="max-w-[210mm] mx-auto border border-gray-300 p-8 print:border-0 print:p-0">

                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-bold border-2 border-black py-2">SOTO Del Prior</h1>
                    <div className="mt-2 border-2 border-black py-1">
                        <h2 className="text-xl font-bold uppercase">Ficha técnica</h2>
                    </div>
                </div>

                {/* Top Info Grid */}
                <div className="grid grid-cols-2 gap-8 mb-6">
                    {/* Left: Recipe Name */}
                    <div className="flex">
                        <div className="w-1/3 bg-black text-white font-bold p-2 flex items-center justify-center uppercase">
                            Receta:
                        </div>
                        <div className="w-2/3 border-2 border-black p-2 flex items-center justify-center font-bold text-lg">
                            {recipe.name}
                        </div>
                    </div>

                    {/* Right: Category & Packaging */}
                    <div className="flex flex-col gap-0 border-2 border-black">
                        <div className="flex border-b border-black">
                            <div className="w-1/2 bg-black text-white font-bold p-1 text-center text-sm uppercase">Tipo de elaboración</div>
                            <div className="w-1/2 bg-gray-200 p-1 text-center font-bold">{recipe.category || '-'}</div>
                        </div>
                        <div className="flex">
                            <div className="w-1/2 bg-black text-white font-bold p-1 text-center text-sm uppercase">Envasado</div>
                            <div className="w-1/2 bg-white p-1 text-center">{recipe.packaging || '-'}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-6">
                    {/* Production & Portions */}
                    <div className="flex flex-col gap-2">
                        <div className="flex border-2 border-black">
                            <div className="w-1/2 bg-black text-white font-bold p-1 pl-4 uppercase">Producción</div>
                            <div className="w-1/2 bg-white p-1 text-center font-bold">{recipe.yieldQuantity} {recipe.yieldUnit}</div>
                        </div>
                        <div className="flex border-2 border-black">
                            <div className="w-1/2 bg-black text-white font-bold p-1 pl-4 uppercase">Número de porciones</div>
                            <div className="w-1/2 bg-white p-1 text-center font-bold">{recipe.portions || '-'}</div>
                        </div>
                    </div>

                    {/* Times */}
                    <div className="flex flex-col gap-2">
                        <div className="flex border-2 border-black">
                            <div className="w-1/2 bg-black text-white font-bold p-1 pl-4 uppercase">Tiempo de preparación</div>
                            <div className="w-1/2 bg-white p-1 text-center">{recipe.prepTime ? `${recipe.prepTime} mins` : '-'}</div>
                        </div>
                        <div className="flex border-2 border-black">
                            <div className="w-1/2 bg-black text-white font-bold p-1 pl-4 uppercase">Tiempo de cocción</div>
                            <div className="w-1/2 bg-white p-1 text-center">{recipe.cookTime ? `${recipe.cookTime} mins` : '-'}</div>
                        </div>
                    </div>
                </div>

                {/* Ingredients Table */}
                <div className="mb-6">
                    <table className="w-full border-2 border-black text-sm">
                        <thead className="bg-black text-white uppercase">
                            <tr>
                                <th className="p-1 text-left w-1/2">Producto</th>
                                <th className="p-1 text-center w-1/4">Unidades</th>
                                <th className="p-1 text-center w-1/4">Cantidad en {recipe.yieldUnit || 'KG/L'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recipe.items.map((item, i) => (
                                <tr key={item.id} className={i % 2 === 0 ? 'bg-gray-100' : 'bg-white'}>
                                    <td className="border border-black p-1 font-medium">
                                        {item.type === 'INGREDIENT' ? item.ingredient?.name : item.subRecipe?.name}
                                    </td>
                                    <td className="border border-black p-1 text-center">
                                        {item.unit === 'UD' ? item.quantityGross : ''}
                                    </td>
                                    <td className="border border-black p-1 text-center font-bold">
                                        {item.unit !== 'UD' ? item.quantityGross : ''}
                                    </td>
                                </tr>
                            ))}
                            {/* Empty rows to fill space if needed */}
                            {Array.from({ length: Math.max(0, 10 - recipe.items.length) }).map((_, i) => (
                                <tr key={`empty-${i}`} className="h-6">
                                    <td className="border border-black"></td>
                                    <td className="border border-black"></td>
                                    <td className="border border-black"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Method / Steps */}
                <div className="mb-6 border-2 border-black">
                    <div className="bg-black text-white font-bold p-1 text-center uppercase">Método de elaboración</div>
                    <div>
                        {(recipe.steps && recipe.steps.length > 0) ? (
                            recipe.steps.map((step) => (
                                <div key={step.id} className="flex border-b border-black last:border-b-0 text-sm">
                                    <div className="w-10 bg-gray-200 border-r border-black flex items-center justify-center font-bold flex-shrink-0">
                                        {step.order}
                                    </div>
                                    <div className="p-2 w-full">
                                        {step.description}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-gray-400 italic">Sin pasos definidos</div>
                        )}
                        {/* Legacy instructions fallback if no steps */}
                        {(!recipe.steps || recipe.steps.length === 0) && recipe.instructions && (
                            <div className="p-2 border-t border-black text-sm whitespace-pre-wrap">
                                {recipe.instructions}
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes (Footer) */}
                <div className="text-sm font-bold italic mt-4">
                    Notas:
                </div>

            </div>

            <script dangerouslySetInnerHTML={{
                __html: `
                // Auto-print option or just helper
            `}} />
        </main>
    );
}
