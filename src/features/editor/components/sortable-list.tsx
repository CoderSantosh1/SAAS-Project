"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

function SortableRow({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`flex items-center gap-1 rounded-md border border-border bg-surface ${isDragging ? "z-10 shadow-card" : ""}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        aria-label={`Move ${label}`}
        className="flex cursor-grab touch-none items-center self-stretch px-1 text-muted-text hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

// Reordering works by drag and by keyboard: focus a handle, press Space, use the arrows.
export function SortableList<T extends { id: string }>({
  dndId,
  items,
  getLabel,
  onMove,
  renderItem,
}: {
  dndId: string;
  items: T[];
  getLabel: (item: T) => string;
  onMove: (from: number, to: number) => void;
  renderItem: (item: T) => ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    if (from !== -1 && to !== -1) onMove(from, to);
  };

  return (
    <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-1.5">
          {items.map((item) => (
            <SortableRow key={item.id} id={item.id} label={getLabel(item)}>
              {renderItem(item)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
