import Form from '@/app/ui/menu-planning/create-form';
import { prisma } from '@/lib/prisma';
import Breadcrumbs from '@/app/ui/breadcrumbs';

export default async function Page() {
    const recipes = await prisma.recipe.findMany({
        where: { category: 'ELABORACION_FINAL' },
        orderBy: { name: 'asc' },
    });

    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Planificación Menú', href: '/dashboard/menu-planning' },
                    {
                        label: 'Crear Servicio',
                        href: '/dashboard/menu-planning/create',
                        active: true,
                    },
                ]}
            />
            <Form recipes={recipes} />
        </main>
    );
}
