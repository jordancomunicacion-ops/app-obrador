import { calculateSmartShoppingList } from "@/app/lib/smart-shopping";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import PageHeader from "@/app/ui/primitives/page-header";
import Button from "@/app/ui/primitives/button";
import Badge from "@/app/ui/primitives/badge";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ start?: string; end?: string }>;
}) {
  const params = await searchParams;
  const startDate = params?.start ? new Date(params.start) : new Date();
  const endDate = params?.end
    ? new Date(params.end)
    : new Date(new Date().setDate(new Date().getDate() + 30));

  const recommendations = await calculateSmartShoppingList(startDate, endDate);

  return (
    <main>
      <PageHeader
        icon={<ShoppingCartIcon className="w-6 h-6" />}
        title="Planificación de compras"
        description={`Necesidades según eventos confirmados (${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}).`}
      />

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Recomendaciones de compra</h3>
        </div>
        <ul role="list" className="divide-y divide-gray-100">
          {recommendations.length === 0 && (
            <li className="p-6 text-center text-gray-500 italic">
              No hay necesidades detectadas para este periodo.
            </li>
          )}
          {recommendations.map((rec, idx) => (
            <li
              key={idx}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-5 px-6 hover:bg-gray-50 sm:flex-nowrap"
            >
              <div className="flex-grow">
                <div className="flex items-center gap-x-2">
                  <p className="text-sm font-semibold text-gray-900">{rec.productName}</p>
                  {rec.type === "TRANSFORMATION" && (
                    <Badge tone="success">Optimización ({rec.score.toFixed(0)}%)</Badge>
                  )}
                  {rec.type === "DIRECT" && <Badge tone="neutral">Directo</Badge>}
                </div>
                <p className="mt-1 text-xs text-gray-500">{rec.reason}</p>
              </div>
              <div className="flex flex-none items-center gap-x-4">
                <div className="flex flex-col items-end">
                  <p className="text-sm font-bold text-gray-900">
                    {rec.quantityToBuy.toFixed(2)} KG
                  </p>
                  {rec.supplier && <p className="text-xs text-gray-500">{rec.supplier}</p>}
                </div>
                <Button variant="secondary" size="sm">
                  Añadir
                </Button>
              </div>
              <div className="w-full mt-2 pl-4 border-l-2 border-gray-100">
                <details className="group">
                  <summary className="flex cursor-pointer items-center text-xs font-medium text-[var(--accent-soft-contrast)] hover:underline">
                    Ver detalle de uso
                  </summary>
                  <div className="mt-2 space-y-1 text-xs text-gray-600">
                    <p className="font-semibold text-gray-900">Cubierto:</p>
                    {rec.coveredIngredients.map((cov, i) => (
                      <p key={i}>
                        - {cov.name}: {cov.quantity.toFixed(2)} ({cov.percentage}%)
                      </p>
                    ))}
                    {rec.wasteOrSurplus.length > 0 && (
                      <>
                        <p className="font-semibold text-gray-900 mt-2">Excedente / Merma:</p>
                        {rec.wasteOrSurplus.map((waste, i) => (
                          <p key={i} className="text-orange-600">
                            - {waste.name}: {waste.quantity.toFixed(2)}
                          </p>
                        ))}
                      </>
                    )}
                  </div>
                </details>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
