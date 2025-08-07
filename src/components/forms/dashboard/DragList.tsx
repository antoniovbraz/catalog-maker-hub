import React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { PricingCard } from "./PricingCard";
import type { PricingResult } from "./types";

interface DragListProps {
  results: PricingResult[];
  cardOrder: string[];
  onDragEnd: (event: DragEndEvent) => void;
}

export const DragList: React.FC<DragListProps> = ({ results, cardOrder, onDragEnd }) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={cardOrder} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((result, index) => (
            <PricingCard key={result.marketplace_id} result={result} index={index} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
