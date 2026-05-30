import Form from '@/app/ui/inventory/edit-form';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { HomeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { locationScope } from '@/lib/auth/scope';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const ingredient = await prisma.ingredient.findFirst({
        where: { ...(await locationScope()), id },
    });

    if (!ingredient) {
        notFound();
    }

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
                                <Link href="/dashboard/inventory" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                                    Inventario
                                </Link>
                            </div>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <span className="text-gray-300">/</span>
                                <span className="ml-4 text-sm font-medium text-gray-500" aria-current="page">Editar</span>
                            </div>
                        </li>
                    </ol>
                </nav>
            </div>
            <h1 className="my-8 text-2xl font-bold">Editar Ingrediente</h1>
            <Form ingredient={ingredient} />
        </main>
    );
}
