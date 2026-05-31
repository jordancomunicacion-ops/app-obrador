"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
import { Bars3Icon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { reorderMyTasks } from "@/app/lib/actions/tasks";

export type ProdTask = {
  id: string;
  title: string;
  status: string;
  targetQuantity: number | null;
  unit: string | null;
  recipe: { name: string; category: string } | null;
};

export default function ProductionList({ tasks }: { tasks: ProdTask[] }) {
  const [items, setItems] = useState<ProdTask[]>(tasks);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((t) => t.id === active.id);
    const newIdx = items.findIndex((t) => t.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const next = arrayMove(items, oldIdx, newIdx);
    setItems(next);
    startTransition(async () => {
      await reorderMyTasks(next.map((t) => t.id));
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((t) => (
            <ProductionTaskCard key={t.id} task={t} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function ProductionTaskCard({ task }: { task: ProdTask }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const categoryBadge =
    task.recipe?.category === "ELABORACION_FINAL"
      ? { label: "Final", cls: "bg-indigo-100 text-indigo-700" }
      : task.recipe?.category === "ELABORACION_INTERMEDIA"
        ? { label: "Intermedia", cls: "bg-teal-100 text-teal-700" }
        : null;
  const statusCls: Record<string, string> = {
    PENDING: "text-gray-600 bg-gray-100",
    IN_PROGRESS: "text-amber-700 bg-amber-100",
    DONE: "text-green-700 bg-green-100",
    ISSUE: "text-red-700 bg-red-100",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "flex items-stretch gap-1 bg-white border-2 border-gray-200 rounded-xl",
        isDragging && "opacity-50",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="flex-none px-2 flex items-center text-gray-400 hover:text-gray-600 cursor-grab touch-none"
        aria-label="Reordenar"
      >
        <Bars3Icon className="w-5 h-5" />
      </button>
      <Link
        href={`/dashboard/tasks/board?focus=${task.id}`}
        className="flex-1 min-w-0 py-4 pr-4 hover:bg-gray-50/60 transition-colors active:scale-[0.99]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-800 truncate">{task.title}</h3>
              {categoryBadge && (
                <span
                  className={clsx(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded flex-none",
                    categoryBadge.cls,
                  )}
                >
                  {categoryBadge.label}
                </span>
              )}
            </div>
            {task.recipe && <p className="text-xs text-gray-500">Receta: {task.recipe.name}</p>}
            {task.targetQuantity && (
              <p className="text-xs text-gray-700 mt-1">
                Objetivo: {task.targetQuantity} {task.unit ?? "ud"}
              </p>
            )}
          </div>
          <span
            className={clsx(
              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-none",
              statusCls[task.status] ?? "bg-gray-100 text-gray-600",
            )}
          >
            {task.status}
          </span>
        </div>
      </Link>
    </div>
  );
}
