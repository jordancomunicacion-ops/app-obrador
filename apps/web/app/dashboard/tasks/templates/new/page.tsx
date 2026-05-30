import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { currentOrgId } from "@/auth";
import { createTemplate } from "@/app/lib/actions/checklist-templates";

export default async function NewTemplatePage() {
  const orgId = await currentOrgId();
  if (!orgId) return null;
  const locations = await prisma.location.findMany({
    where: { ownerId: orgId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Nueva plantilla</h2>
      <form action={createTemplate} className="space-y-4 bg-white border border-gray-200 rounded-lg p-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Apertura, Cierre, MEP cocina..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="locationId" className="block text-sm font-medium text-gray-700 mb-1">
            Local
          </label>
          <select
            id="locationId"
            name="locationId"
            defaultValue=""
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos los locales</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Link
            href="/dashboard/tasks/templates"
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Crear y editar campos
          </button>
        </div>
      </form>
    </div>
  );
}
