"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Station } from "@/types/station";
import { reorderStationsAction } from "@/lib/admin/actions";
import { Card, CardSubtitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function SortableRow({ station }: { station: Station }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: station.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
    >
      <Card className="flex items-center gap-3 py-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted px-2 min-h-12 flex items-center"
          aria-label={`שנו סדר עבור ${station.name}`}
        >
          ⠿
        </button>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mint/15 text-mint font-black">
          {station.orderIndex}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-bold truncate">{station.name}</p>
          <CardSubtitle className="truncate">
            /{station.slug} {station.isDefaultStart && "· ברירת מחדל"} {!station.isPublished && "· טיוטה"}
          </CardSubtitle>
        </div>
        <span
          className={`h-2.5 w-2.5 rounded-full shrink-0 ${station.isPublished ? "bg-mint" : "bg-stone"}`}
          title={station.isPublished ? "מפורסם" : "טיוטה"}
        />
        <Button href={`/admin/stations/${station.id}`} variant="ghost" size="md">
          עריכה
        </Button>
      </Card>
    </div>
  );
}

export function StationsList({ stations: initial }: { stations: Station[] }) {
  const [stations, setStations] = useState(
    [...initial].sort((a, b) => a.orderIndex - b.orderIndex)
  );
  const [, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setStations((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id);
      const newIndex = prev.findIndex((s) => s.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex).map((s, i) => ({ ...s, orderIndex: i + 1 }));

      startTransition(() => {
        void reorderStationsAction(reordered.map((s) => ({ id: s.id, orderIndex: s.orderIndex })));
      });

      return reordered;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">תחנות</h1>
        <Button href="/admin/stations/new">תחנה חדשה</Button>
      </div>
      <p className="text-sm text-muted">גררו לפי הידית ⠿ כדי לשנות את סדר התחנות במסלול.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={stations.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {stations.map((station) => (
              <SortableRow key={station.id} station={station} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
