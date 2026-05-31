import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { currentOrgId } from "@/auth";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import TemplateEditor from "@/app/ui/tasks/template-editor";
import {
  updateTemplate,
  deleteTemplate,
} from "@/app/lib/actions/checklist-templates";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const orgId = await currentOrgId();
  if (!orgId) notFound();

  const tpl = await prisma.checklistTemplate.findFirst({
    where: { id, ownerId: orgId },
    include: {
      fields: { orderBy: { order: "asc" } },
      location: true,
    },
  });
  if (!tpl) notFound();

  const locations = await prisma.location.findMany({
    where: { ownerId: orgId, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const updateAction = updateTemplate.bind(null, tpl.id);
  const deleteAction = deleteTemplate.bind(null, tpl.id);

  return (
    <div>
      <Link
        href="/dashboard/tasks/templates"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Volver a plantillas
      </Link>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Información</h3>
            <form action={updateAction} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                <input
                  name="name"
                  defaultValue={tpl.name}
                  required
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Descripción
                </label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={tpl.description ?? ""}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Local</label>
                <select
                  name="locationId"
                  defaultValue={tpl.locationId ?? ""}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Todos los locales</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={tpl.isActive}
                  className="rounded"
                />
                Activa
              </label>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
              >
                Guardar cambios
              </button>
            </form>
          </div>

          <form action={deleteAction}>
            <button
              type="submit"
              className="w-full text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg px-3 py-2 transition-colors"
            >
              Eliminar plantilla
            </button>
          </form>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Campos ({tpl.fields.length})
            </h3>
            <TemplateEditor
              templateId={tpl.id}
              initialFields={tpl.fields.map((f) => ({
                id: f.id,
                order: f.order,
                type: f.type,
                name: f.name,
                description: f.description,
                exampleImageUrl: f.exampleImageUrl,
                photoRequirement: f.photoRequirement,
              }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
