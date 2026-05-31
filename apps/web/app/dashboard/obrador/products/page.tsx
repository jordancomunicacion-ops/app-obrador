import Link from 'next/link';
import {
  PlusIcon,
  ArchiveBoxIcon,
  TagIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';
import { prisma } from '@/app/lib/prisma';
import { locationScope } from '@/app/lib/auth/scope';
import DeleteObradorProduct from '@/app/ui/obrador/delete-product';

export default async function ObradorProductsPage() {
  const products = await prisma.masterProduct.findMany({
    where: { isObrador: true, ...(await locationScope()) },
    include: { sanitaryInfo: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <ArchiveBoxIcon className="w-8 h-8 text-emerald-600" />
            Catálogo de Productos Pack
          </h1>
          <p className="text-slate-600 mt-1">
            Gestiona los productos destinados a envasado y venta.
          </p>
        </div>
        <Link
          href="/dashboard/obrador/products/create"
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          Nuevo Producto
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center p-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <ArchiveBoxIcon className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500">
            Aún no hay productos de obrador. Crea el primero con “Nuevo Producto”.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const allergens = product.sanitaryInfo?.allergens
              ? product.sanitaryInfo.allergens.split(',').map((a) => a.trim()).filter(Boolean)
              : [];
            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-emerald-300 transition-colors"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded uppercase tracking-wider">
                      {product.category || 'Sin categoría'}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 text-sm">
                      <TagIcon className="w-4 h-4" />
                      {product.sanitaryInfo?.nutritionalStatus === 'verificado'
                        ? 'Verificado'
                        : 'Pendiente'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{product.name}</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Vida útil:</span>{' '}
                      {product.sanitaryInfo?.shelfLifeDays != null
                        ? `${product.sanitaryInfo.shelfLifeDays} días`
                        : '—'}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {allergens.length > 0 ? (
                        allergens.map((a) => (
                          <span
                            key={a}
                            className="px-2 py-0.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded border border-rose-100"
                          >
                            {a}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Sin alérgenos declarados
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-slate-100 pt-4 mt-2">
                    <Link
                      href={`/dashboard/obrador/products/${product.id}/edit`}
                      className="flex-1 text-center py-2 bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      Editar
                    </Link>
                    <Link
                      href={`/dashboard/obrador/production/create?productId=${product.id}`}
                      className="flex-1 text-center py-2 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <BeakerIcon className="w-4 h-4" />
                      Crear Lote
                    </Link>
                    <DeleteObradorProduct id={product.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
