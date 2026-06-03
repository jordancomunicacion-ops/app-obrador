import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { PlusIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

export default async function TemplatesPage() {
  const orgId = await currentOrgId();
  if (!orgId) return null;

  const templates = await prisma.checklistTemplate.findMany({
    where: { businessId: orgId },
    include: {
      location: { select: { name: true, shortCode: true } },
      _count: { select: { fields: true, schedules: true } },
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          {templates.length} {templates.length === 1 ? "plantilla" : "plantillas"}
        </p>
        <Link
          href="/dashboard/tasks/templates/new"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Añadir plantilla
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="text-center p-12 border-2 border-dashed border-gray-200 rounded-lg">
          <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-300" />
          <p className="mt-2 text-gray-500">Aún no has creado ninguna plantilla.</p>
          <Link
            href="/dashboard/tasks/templates/new"
            className="mt-4 inline-block text-indigo-600 hover:underline text-sm font-medium"
          >
            Crear la primera plantilla
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Local</th>
                <th className="px-4 py-3 text-center">Tareas</th>
                <th className="px-4 py-3 text-center">Programaciones</th>
                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {templates.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/tasks/templates/${t.id}`}
                      className="font-medium text-gray-800 hover:text-indigo-600"
                    >
                      {t.name}
                    </Link>
                    {t.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {t.location?.name ?? <span className="text-gray-400 italic">Todos</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">{t._count.fields}</td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {t._count.schedules}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={clsx(
                        "inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                        t.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600",
                      )}
                    >
                      {t.isActive ? "Activo" : "Inactivo"}
                    </span>
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
