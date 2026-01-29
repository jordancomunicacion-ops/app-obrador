'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export default function CategoryFilter() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleFilter = (category: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1');
        if (category && category !== 'ALL') {
            params.set('category', category);
        } else {
            params.delete('category');
        }
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="relative">
            <label htmlFor="category-filter" className="sr-only">
                Filtrar por tipo
            </label>
            <select
                id="category-filter"
                className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-3 pr-10 text-sm outline-2"
                onChange={(e) => handleFilter(e.target.value)}
                defaultValue={searchParams.get('category')?.toString() || 'ALL'}
            >
                <option value="ALL">Todos los tipos</option>
                <option value="PRODUCTO_NO_ELABORADO">Productos</option>
                <option value="ELABORACION_INTERMEDIA">Elaboraciones Intermedias</option>
                <option value="ELABORACION_FINAL">Elaboraciones Finales</option>
            </select>
        </div>
    );
}
