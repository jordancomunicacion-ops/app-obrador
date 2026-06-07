import Link from 'next/link';
import { BuildingStorefrontIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { prisma } from '@/app/lib/prisma';
import { locationScope } from '@/app/lib/auth/scope';
import { SHOP_CATEGORY_LABELS, SHOP_CATEGORY_ORDER } from '@/app/lib/ecommerce-constants';
import OnlineCategorySelect from '@/app/ui/ecommerce/online-category-select';

export default async function EcommerceProductsPage() {
  // Solo los productos con venta web activada (se activa en la ficha del producto).
  const products = await prisma.masterProduct.findMany({
    where: { ...(await locationScope()), isSellableOnline: true },
    orderBy: [{ onlineCategory: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      salePrice: true,
      onlineCategory: true,
    },
  });

  // Agrupar por categoría de tienda (orden definido; sin categoría al final).
  const groups = new Map<string, typeof products>();
  for (const p of products) {
    const key = p.onlineCategory && SHOP_CATEGORY_ORDER.includes(p.onlineCategory)
      ? p.onlineCategory
      : '__none__';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  const orderedKeys = [...SHOP_CATEGORY_ORDER.filter((k) => groups.has(k))];
  if (groups.has('__none__')) orderedKeys.push('__none__');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <BuildingStorefrontIcon className="w-8 h-8 text-emerald-600" />
          Productos online
        </h1>
        <p className="text-slate-600 mt-1">
          Productos a la venta en la tienda web ({products.length}). La venta se activa en la ficha
          del producto (Catálogo → Productos); aquí los organizas por categoría.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="text-center p-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <BuildingStorefrontIcon className="w-12 h-12 mx-auto text-slate-300" />
          <p className="mt-3 text-slate-500">
            Aún no hay productos a la venta. Abre un producto en{' '}
            <Link href="/dashboard/products" className="text-emerald-600 font-semibold hover:underline">
              Catálogo → Productos
            </Link>{' '}
            y activa <strong>Venta web</strong> en su ficha.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {orderedKeys.map((key) => (
            <section key={key}>
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
                {key === '__none__' ? 'Sin categoría' : SHOP_CATEGORY_LABELS[key] ?? key}
              </h2>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-left text-xs uppercase">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Producto</th>
                      <th className="px-5 py-3 font-semibold">Categoría de tienda</th>
                      <th className="px-5 py-3 font-semibold text-right">Precio</th>
                      <th className="px-5 py-3 font-semibold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groups.get(key)!.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="px-5 py-3 font-medium text-slate-900">{p.name}</td>
                        <td className="px-5 py-3">
                          <OnlineCategorySelect productId={p.id} current={p.onlineCategory} />
                        </td>
                        <td className="px-5 py-3 text-right text-slate-900">
                          {p.salePrice != null ? `${p.salePrice.toFixed(2)} €` : '—'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={`/dashboard/products/${p.id}/edit`}
                            className="inline-flex items-center gap-1 text-emerald-600 font-bold hover:underline"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                            Editar ficha
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
