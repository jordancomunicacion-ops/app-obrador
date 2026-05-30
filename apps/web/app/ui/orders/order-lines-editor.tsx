"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { addLine, removeLine, updateLine } from "@/app/lib/actions/purchase-orders";

type Line = {
  id: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number | null;
  receivedQuantity: number | null;
};

type CatalogProduct = {
  id: string;
  name: string;
  unit: string;
  price: number | null;
};

export default function OrderLinesEditor({
  orderId,
  lines,
  catalog,
  editable,
}: {
  orderId: string;
  lines: Line[];
  catalog: CatalogProduct[];
  editable: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("UD");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [busy, setBusy] = useState(false);

  function handleSelectCatalog(id: string) {
    if (!id) return;
    const p = catalog.find((c) => c.id === id);
    if (!p) return;
    setName(p.name);
    setUnit(p.unit);
    if (p.price != null) setPrice(String(p.price));
  }

  function handleAdd() {
    if (!name.trim() || !qty) {
      alert("Producto y cantidad obligatorios");
      return;
    }
    setBusy(true);
    startTransition(async () => {
      try {
        await addLine(orderId, {
          productName: name,
          unit,
          quantity: parseFloat(qty),
          unitPrice: price ? parseFloat(price) : null,
        });
        setName("");
        setQty("");
        setPrice("");
        router.refresh();
      } catch (e) {
        alert((e as Error).message);
      } finally {
        setBusy(false);
      }
    });
  }

  function handleRemove(lineId: string) {
    if (!confirm("¿Eliminar línea?")) return;
    startTransition(async () => {
      try {
        await removeLine(lineId);
        router.refresh();
      } catch (e) {
        alert((e as Error).message);
      }
    });
  }

  const total = lines.reduce(
    (sum, l) => sum + (l.unitPrice ?? 0) * l.quantity,
    0,
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        Líneas ({lines.length})
      </h2>
      {lines.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Sin líneas. Añade alguna abajo.</p>
      ) : (
        <table className="w-full text-sm mb-3">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
              <th className="text-left py-1">Producto</th>
              <th className="text-center py-1">Cantidad</th>
              <th className="text-center py-1">Unidad</th>
              <th className="text-right py-1">€/ud</th>
              <th className="text-right py-1">Subtotal</th>
              {editable && <th className="py-1"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.map((l) => {
              const subtotal = (l.unitPrice ?? 0) * l.quantity;
              return (
                <tr key={l.id}>
                  <td className="py-1">{l.productName}</td>
                  <td className="py-1 text-center font-mono tabular-nums">{l.quantity}</td>
                  <td className="py-1 text-center text-xs text-gray-500">{l.unit}</td>
                  <td className="py-1 text-right font-mono tabular-nums">
                    {l.unitPrice?.toFixed(2) ?? "—"}
                  </td>
                  <td className="py-1 text-right font-mono tabular-nums font-medium">
                    {subtotal.toFixed(2)} €
                  </td>
                  {editable && (
                    <td className="py-1 text-right">
                      <button
                        onClick={() => handleRemove(l.id)}
                        className="text-red-500 hover:text-red-700"
                        aria-label="Eliminar"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          {total > 0 && (
            <tfoot>
              <tr className="border-t border-gray-200">
                <td colSpan={4} className="py-2 text-right text-sm font-semibold">
                  Total
                </td>
                <td className="py-2 text-right font-mono font-bold tabular-nums">
                  {total.toFixed(2)} €
                </td>
                {editable && <td></td>}
              </tr>
            </tfoot>
          )}
        </table>
      )}

      {editable && (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-medium text-gray-600 mb-2">Añadir línea</p>
          {catalog.length > 0 && (
            <select
              defaultValue=""
              onChange={(e) => handleSelectCatalog(e.target.value)}
              className="w-full mb-2 border border-gray-300 rounded px-2 py-1 text-xs"
            >
              <option value="">Seleccionar del catálogo del proveedor...</option>
              {catalog.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.price?.toFixed(2)}€/{c.unit}
                </option>
              ))}
            </select>
          )}
          <div className="grid grid-cols-12 gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Producto"
              className="col-span-5 border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
            <input
              type="number"
              step="0.01"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Cant."
              className="col-span-2 border border-gray-300 rounded px-2 py-1.5 text-sm text-right"
            />
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="UD"
              className="col-span-1 border border-gray-300 rounded px-2 py-1.5 text-sm text-center"
            />
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="€/ud"
              className="col-span-2 border border-gray-300 rounded px-2 py-1.5 text-sm text-right"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={busy}
              className="col-span-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded inline-flex items-center justify-center gap-1"
            >
              <PlusIcon className="w-4 h-4" />
              Añadir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
