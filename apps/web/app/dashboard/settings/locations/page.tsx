import clsx from "clsx";
import { prisma } from "@/lib/prisma";
import { currentOrgId } from "@/auth";
import { createLocation, updateLocation, deleteLocation } from "@/app/lib/actions/locations";
import { BuildingStorefrontIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

export default async function LocationsSettingsPage() {
  const orgId = await currentOrgId();
  if (!orgId) return null;

  const locations = await prisma.location.findMany({
    where: { ownerId: orgId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, shortCode: true, address: true, isActive: true },
  });

  return (
    <main className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Locales</h1>
      <p className="text-sm text-gray-500 mb-6">
        Locales bajo tu organización. Cada plantilla, programación y empleado puede asociarse a un local.
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <PlusIcon className="w-4 h-4" />
          Nuevo local
        </h2>
        <form action={createLocation} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <label className="flex flex-col text-xs font-medium text-gray-600">
            Nombre *
            <input
              name="name"
              required
              placeholder="SOTO del PRIOR Pamplona"
              className="mt-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col text-xs font-medium text-gray-600">
            Código corto
            <input
              name="shortCode"
              placeholder="SOTO"
              maxLength={10}
              className="mt-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col text-xs font-medium text-gray-600 sm:col-span-2">
            Dirección
            <input
              name="address"
              placeholder="C/ Mayor 1, Pamplona"
              className="mt-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="submit"
            className="sm:col-span-4 sm:w-fit bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Añadir local
          </button>
        </form>
      </div>

      {locations.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-gray-200 rounded-lg">
          <BuildingStorefrontIcon className="w-12 h-12 mx-auto text-gray-300" />
          <p className="mt-2 text-gray-500">
            Aún no has creado ningún local. Crea al menos uno para empezar a programar checklists.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {locations.map((loc) => {
            const updateAction = updateLocation.bind(null, loc.id);
            const deleteAction = deleteLocation.bind(null, loc.id);
            return (
              <div
                key={loc.id}
                className={clsx(
                  "bg-white border rounded-lg p-4",
                  loc.isActive ? "border-gray-200" : "border-gray-200 opacity-60",
                )}
              >
                <form action={updateAction} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                  <label className="flex flex-col text-xs font-medium text-gray-600">
                    Nombre
                    <input
                      name="name"
                      defaultValue={loc.name}
                      required
                      className="mt-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="flex flex-col text-xs font-medium text-gray-600">
                    Código
                    <input
                      name="shortCode"
                      defaultValue={loc.shortCode ?? ""}
                      className="mt-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="flex flex-col text-xs font-medium text-gray-600 sm:col-span-2">
                    Dirección
                    <input
                      name="address"
                      defaultValue={loc.address ?? ""}
                      className="mt-1 border border-gray-300 rounded px-2 py-1.5 text-sm"
                    />
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-xs text-gray-700">
                      <input type="checkbox" name="isActive" defaultChecked={loc.isActive} />
                      Activo
                    </label>
                    <button
                      type="submit"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded"
                    >
                      Guardar
                    </button>
                  </div>
                </form>
                <form action={deleteAction} className="mt-2">
                  <button
                    type="submit"
                    className="text-xs text-red-600 hover:underline inline-flex items-center gap-1"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    Eliminar local
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
