import Link from 'next/link';
import { BuildingStorefrontIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { prisma } from '@/app/lib/prisma';
import { locationScope } from '@/app/lib/auth/scope';

export default async function EcommerceProductsPage() {
  const products = await prisma.masterProduct.findMany({
    where: { ...(await locationScope()) },
    orderBy: [{ isSellableOnline: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      category: true,
      isSellableOnline: true,
      salePrice: true,
      onlineImageUrl: true,
    },
  });

  const sellableCount = products.filter((p) => p.isSellableOnline).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <BuildingStorefrontIcon className="w-8 h-8 text-emerald-600" />
          Productos online
        </h1>
        <p className="text-slate-600 mt-1">
          Marca qué productos del catálogo se venden en la tienda web y a qué precio.
          La ficha legal y los alérgenos se reutilizan del producto. {sellableCount} a la venta.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center p-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <BuildingStorefrontIcon className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500">
            No hay productos en este local todavía. Créalos en{' '}
            <Link href="/dashboard/products" className="text-emerald-600 font-semibold hover:underline">
              Catálogo → Productos
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left text-xs uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Producto</th>
                <th className="px-5 py-3 font-semibold">Categoría</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 font-semibold text-right">Precio</th>
                <th className="px-5 py-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-medium text-slate-900">{p.name}</td>
                  <td className="px-5 py-3 text-slate-500">{p.category || '—'}</td>
                  <td className="px-5 py-3">
                    {p.isSellableOnline ? (
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded uppercase">
                        A la venta
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase">
                        Oculto
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-900">
                    {p.salePrice != null ? `${p.salePrice.toFixed(2)} €` : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/dashboard/ecommerce/products/${p.id}`}
                      className="inline-flex items-center gap-1 text-emerald-600 font-bold hover:underline"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                      Editar venta
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
