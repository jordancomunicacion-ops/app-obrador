import RecipesTable from '@/app/ui/recipes/table';
import { CreateRecipe } from '@/app/ui/recipes/buttons';
import { Suspense } from 'react';
import Search from '@/app/ui/search';
import CategoryFilter from '@/app/ui/recipes/category-filter';

export default async function Page({
    searchParams,
}: {
    searchParams?: Promise<{
        query?: string;
        page?: string;
        category?: string;
    }>;
}) {
    const params = await searchParams;
    const query = params?.query || '';
    const currentPage = Number(params?.page) || 1;
    const categoryFilter = params?.category || 'ALL';

    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                <h1 className="text-2xl">Recetario (Escandallos)</h1>
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
                <div className="flex gap-2 flex-1">
                    <Search placeholder="Buscar recetas..." />
                    <CategoryFilter />
                </div>
                <CreateRecipe />
            </div>
            <Suspense key={query + categoryFilter} fallback={<div>Cargando recetas...</div>}>
                <RecipesTable query={query} currentPage={currentPage} categoryFilter={categoryFilter} />
            </Suspense>
        </div>
    );
}
