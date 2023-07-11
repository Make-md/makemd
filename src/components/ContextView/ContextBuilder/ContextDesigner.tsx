import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
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
import React, { useContext, useState } from "react";
import { createPortal } from "react-dom";
import { MDBContext } from "../MDBContext";
export const ContextDesigner = (props: {}) => {
  const { sortedColumns, predicate, savePredicate } = useContext(MDBContext);
  const [activeId, setActiveId] = useState("");
  const [overId, setOverId] = useState("");
  const items = sortedColumns.map((f) => ({ ...f, id: f.name + f.table }));
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const resetState = () => {
    setActiveId(null);
    setOverId(null);
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      onDragStart={({ active }) => {
        setActiveId(active.id as string);
      }}
      onDragOver={({ active, over }) => {
        const overId = over?.id;
        if (overId) setOverId(overId as string);
      }}
      onDragEnd={({ active, over }) => {
        const overId = over?.id;

        if (!overId) {
          resetState();
          return;
        }

        savePredicate({
          ...predicate,
          colsOrder: arrayMove(
            predicate.colsOrder,
            predicate.colsOrder.findIndex((f) => f == activeId),
            predicate.colsOrder.findIndex((f) => f == overId)
          ),
        });

        resetState();
      }}
      onDragCancel={resetState}
    >
      <div className="mk-context-maker-layout">
        <div>
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {items.map((value, index) => {
              return (
                <SortableItem id={value.id} value={value.name}></SortableItem>
              );
            })}
          </SortableContext>
        </div>
      </div>
      {createPortal(
        <DragOverlay adjustScale={false}>
          {activeId ? (
            <SortableItem
              id={items.find((f) => f.id == activeId).id}
              value={items.find((f) => f.id == activeId).name}
            ></SortableItem>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
};

import { CSS } from "@dnd-kit/utilities";

function SortableItem(props: { id: string; value: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {props.value}
    </div>
  );
}
