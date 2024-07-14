import {
  DndContext,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { WindowProvider } from "core/react/context/WindowContext";
import { useInTreeCreateRoot } from "core/react/hooks/useInTreeCreateRoot";
import React, { useEffect } from "react";
import { ObsidianUI } from "./ui";
export const WindowManager = (props: { ui: ObsidianUI }) => {
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
  const { createRoot, portals, getRoot } = useInTreeCreateRoot();
  // Show a portal with a unique key
  useEffect(() => {
    props.ui.createRoot = createRoot;
    props.ui.getRoot = getRoot;
    props.ui.manager.eventsDispatch.dispatchEvent("windowReady", null);
  }, [createRoot]);

  const [dragActive, setDragActive] = React.useState(false);

  // Render each portal content
  return (
    <DndContext
      sensors={sensors}
      onDragStart={() => {
        setDragActive(true);
      }}
      onDragEnd={() => {
        setDragActive(false);
        document.body.style.setProperty("cursor", "");
      }}
      onDragCancel={() => {
        setDragActive(false);
      }}
      collisionDetection={rectIntersection}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
    >
      <WindowProvider dragActive={dragActive}>{portals}</WindowProvider>
    </DndContext>
  );
};
