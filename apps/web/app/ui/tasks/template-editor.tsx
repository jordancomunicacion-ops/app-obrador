"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Bars3Icon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  CameraIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  addField,
  updateField,
  deleteField,
  reorderFields,
} from "@/app/lib/actions/checklist-templates";

type FieldType = "TITLE" | "CHECK" | "TEXT" | "YES_NO" | "RATING_1_10";
type PhotoReq = "NONE" | "OPTIONAL" | "REQUIRED";

type Field = {
  id: string;
  order: number;
  type: FieldType;
  name: string;
  description: string | null;
  exampleImageUrl: string | null;
  photoRequirement: PhotoReq;
};

const TYPE_LABELS: Record<FieldType, string> = {
  TITLE: "Título",
  CHECK: "Check",
  TEXT: "Texto",
  YES_NO: "Sí / No",
  RATING_1_10: "Valoración 1-10",
};

const PHOTO_LABELS: Record<PhotoReq, string> = {
  NONE: "Sin foto",
  OPTIONAL: "Foto opcional",
  REQUIRED: "Foto obligatoria",
};

export default function TemplateEditor({
  templateId,
  initialFields,
}: {
  templateId: string;
  initialFields: Field[];
}) {
  const [fields, setFields] = useState<Field[]>(initialFields);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = fields.findIndex((f) => f.id === active.id);
    const newIdx = fields.findIndex((f) => f.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const next = arrayMove(fields, oldIdx, newIdx);
    setFields(next);
    startTransition(async () => {
      await reorderFields(
        templateId,
        next.map((f) => f.id),
      );
    });
  }

  async function handleSaveField(data: {
    id?: string;
    type: FieldType;
    name: string;
    description?: string;
    exampleImageUrl?: string;
    photoRequirement: PhotoReq;
  }) {
    startTransition(async () => {
      if (data.id) {
        await updateField(data.id, {
          type: data.type,
          name: data.name,
          description: data.description,
          exampleImageUrl: data.exampleImageUrl,
          photoRequirement: data.photoRequirement,
        });
      } else {
        await addField(templateId, {
          type: data.type,
          name: data.name,
          description: data.description,
          exampleImageUrl: data.exampleImageUrl,
          photoRequirement: data.photoRequirement,
        });
      }
      setEditingId(null);
      router.refresh();
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este campo?")) return;
    startTransition(async () => {
      await deleteField(id);
      setFields((curr) => curr.filter((f) => f.id !== id));
    });
  }

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {fields.map((f) => (
              <FieldRow
                key={f.id}
                field={f}
                onEdit={() => setEditingId(f.id)}
                onDelete={() => handleDelete(f.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={() => setEditingId("new")}
        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-600 hover:text-indigo-600 hover:border-indigo-400 rounded-lg text-sm font-medium transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        Añadir campo
      </button>

      {editingId !== null && (
        <FieldModal
          field={editingId === "new" ? null : fields.find((f) => f.id === editingId) ?? null}
          onClose={() => setEditingId(null)}
          onSave={handleSaveField}
        />
      )}
    </div>
  );
}

function FieldRow({
  field,
  onEdit,
  onDelete,
}: {
  field: Field;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={clsx(
        "flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2.5",
        isDragging && "opacity-50",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-600 touch-none"
        aria-label="Reordenar"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "inline-block px-2 py-0.5 rounded-full text-xs font-medium",
              field.type === "TITLE"
                ? "bg-amber-100 text-amber-700"
                : "bg-indigo-50 text-indigo-700",
            )}
          >
            {TYPE_LABELS[field.type]}
          </span>
          <p className="font-medium text-gray-800 truncate">{field.name}</p>
          {field.photoRequirement === "REQUIRED" && (
            <CameraIcon className="w-4 h-4 text-red-500" title="Foto obligatoria" />
          )}
          {field.photoRequirement === "OPTIONAL" && (
            <CameraIcon className="w-4 h-4 text-gray-400" title="Foto opcional" />
          )}
        </div>
        {field.description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{field.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="p-1.5 text-gray-500 hover:text-indigo-600 transition-colors"
        aria-label="Editar"
      >
        <PencilSquareIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="p-1.5 text-gray-500 hover:text-red-600 transition-colors"
        aria-label="Eliminar"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </li>
  );
}

function FieldModal({
  field,
  onClose,
  onSave,
}: {
  field: Field | null;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    type: FieldType;
    name: string;
    description?: string;
    exampleImageUrl?: string;
    photoRequirement: PhotoReq;
  }) => void;
}) {
  const [type, setType] = useState<FieldType>(field?.type ?? "CHECK");
  const [name, setName] = useState(field?.name ?? "");
  const [description, setDescription] = useState(field?.description ?? "");
  const [photoRequirement, setPhotoRequirement] = useState<PhotoReq>(
    field?.photoRequirement ?? "NONE",
  );
  const [exampleImageUrl, setExampleImageUrl] = useState(field?.exampleImageUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("prefix", "templates/examples");
      const res = await fetch("/api/uploads/photo", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setExampleImageUrl(json.url);
    } catch (e) {
      alert("Error subiendo imagen: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            {field ? "Editar campo" : "Nuevo campo"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo <span className="text-red-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as FieldType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {(Object.keys(TYPE_LABELS) as FieldType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagen de ejemplo
            </label>
            <div className="flex items-center gap-3">
              {exampleImageUrl ? (
                <img
                  src={exampleImageUrl}
                  alt="ejemplo"
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center">
                  <PhotoIcon className="w-8 h-8 text-gray-300" />
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {uploading ? "Subiendo..." : exampleImageUrl ? "Cambiar" : "Subir imagen"}
                </button>
                {exampleImageUrl && (
                  <button
                    type="button"
                    onClick={() => setExampleImageUrl("")}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opciones de foto</label>
            <select
              value={photoRequirement}
              onChange={(e) => setPhotoRequirement(e.target.value as PhotoReq)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {(Object.keys(PHOTO_LABELS) as PhotoReq[]).map((p) => (
                <option key={p} value={p}>
                  {PHOTO_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() =>
              onSave({
                id: field?.id,
                type,
                name,
                description,
                exampleImageUrl,
                photoRequirement,
              })
            }
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
