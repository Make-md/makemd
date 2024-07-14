import { DragOverlay, useDndMonitor } from "@dnd-kit/core";
import React from "react";
import { createPortal } from "react-dom";

type WindowContextType = {
  dragNode: React.ReactNode;
  setDragNode: (node: React.ReactNode) => void;
  dragActive: boolean;
};
export const WindowContext = React.createContext<WindowContextType>({
  dragNode: null,
  setDragNode: () => null,
  dragActive: false,
});
export const WindowProvider = (
  props: React.PropsWithChildren<{
    dragActive: boolean;
  }>
) => {
  const [dragNode, setDragNode] = React.useState<React.ReactNode>(null);

  useDndMonitor({
    onDragCancel: () => {
      setDragNode(null);
    },
    onDragEnd: () => {
      setDragNode(null);
    },
  });
  return (
    <WindowContext.Provider
      value={{
        dragNode,
        setDragNode,
        dragActive: props.dragActive,
      }}
    >
      {props.children}
      {dragNode &&
        createPortal(
          <DragOverlay
            dropAnimation={null}
            zIndex={1600}
            // style={{ opacity: 0.5 }}
          >
            {dragNode}
          </DragOverlay>,
          document.body
        )}
    </WindowContext.Provider>
  );
};
