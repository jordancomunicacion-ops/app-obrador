import RecipesTable from '@/app/ui/recipes/table';
import { CreateRecipe } from '@/app/ui/recipes/buttons';
import { Suspense } from 'react';
import Search from '@/app/ui/search';
import CategoryFilter from '@/app/ui/recipes/category-filter';
import PageHeader from '@/app/ui/primitives/page-header';
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline';

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
            <PageHeader
                icon={<DocumentDuplicateIcon className="w-6 h-6" />}
                title="Recetario (escandallos)"
            />
            <div className="flex items-center justify-between gap-2">
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
