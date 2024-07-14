import React, { PropsWithChildren, useEffect, useRef, useState } from "react";
import { Rect } from "types/Pos";

export const FrameNodeEditorContainer = (
  props: PropsWithChildren<{ nodeRect: Rect; containerRect: Rect }>
) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<number>(0);
  const calculateXBasedOnBounds = (
    targetRect: Rect,
    rect: DOMRect,
    containerRect: Rect
  ) => {
    const x = targetRect.x - props.containerRect.x;
    const overflowX = x + rect.width - containerRect.width;
    let newX = x;
    if (overflowX > 0) {
      if (targetRect.x - props.containerRect.x - rect.width > 0)
        newX = containerRect.width - rect.width;
      else {
        newX = 0;
      }
    }
    return newX;
  };
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0].target.getBoundingClientRect();
      setReady(true);
      setPos(
        calculateXBasedOnBounds(props.nodeRect, rect, props.containerRect)
      );
    });
    if (menuRef.current) resizeObserver.observe(menuRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [menuRef]);
  return (
    <div
      className="mk-editor-frame-node-container"
      ref={menuRef}
      style={{
        visibility: ready ? "visible" : "hidden",
        pointerEvents: "auto",
        left: pos,
        bottom: `calc(100% - ${
          props.nodeRect.y - props.containerRect.y - 10
        }px)`,
        maxWidth: props.containerRect.width,
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {props.children}
    </div>
  );
};
