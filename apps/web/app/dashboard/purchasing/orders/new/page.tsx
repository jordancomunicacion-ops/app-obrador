import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentOrgId } from "@/auth";
import { locationScope } from "@/lib/auth/scope";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { createOrder } from "@/app/lib/actions/purchase-orders";

export default async function NewOrderPage() {
  const orgId = await currentOrgId();
  if (!orgId) return null;

  const suppliers = await prisma.supplier.findMany({
    where: { ...(await locationScope()), isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  async function action(formData: FormData) {
    "use server";
    await createOrder({
      supplierId: formData.get("supplierId") as string,
      reference: (formData.get("reference") as string) || undefined,
      expectedDate: (formData.get("expectedDate") as string) || null,
      notes: (formData.get("notes") as string) || undefined,
    });
  }

  return (
    <div className="max-w-xl">
      <Link
        href="/dashboard/purchasing/orders"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver
      </Link>
      <h1 className="text-xl font-semibold text-gray-800 mb-4">Nuevo pedido</h1>

      {suppliers.length === 0 ? (
        <p className="text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-4">
          No tienes proveedores. Crea alguno en{" "}
          <Link href="/dashboard/products" className="underline">
            Productos / Proveedores
          </Link>{" "}
          primero.
        </p>
      ) : (
        <form action={action} className="space-y-3 bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-xs font-medium text-gray-600">
            Proveedor *
            <select
              name="supplierId"
              required
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Referencia
            <input
              type="text"
              name="reference"
              placeholder="P-2026-001"
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Fecha esperada de entrega
            <input
              type="date"
              name="expectedDate"
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-gray-600">
            Notas
            <textarea
              name="notes"
              rows={2}
              className="mt-1 w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-2 rounded-lg"
          >
            Crear y añadir líneas
          </button>
        </form>
      )}
    </div>
  );
}
