import { useDroppable } from "@dnd-kit/core";
import { ContextEditorContext } from "core/react/context/ContextEditorContext";
import { applySat } from "core/utils/color";
import { Superstate } from "makemd-core";
import React, { PropsWithChildren, useContext } from "react";
import { BlinkMode } from "shared/types/blink";
import { windowFromDocument } from "shared/utils/dom";

export const AllDayCell = (
  props: PropsWithChildren<{
    superstate: Superstate;
    date: Date;
    height: number;
    insertItem: (path: string) => void;
  }>
) => {
  const { source } = useContext(ContextEditorContext);
  const { setNodeRef } = useDroppable({
    id: "allday-" + props.date.toISOString(),
  });
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.detail === 2) {
      const rect = e.currentTarget.getBoundingClientRect();
      props.superstate.ui.quickOpen(
        BlinkMode.Open,
        rect,
        windowFromDocument(e.currentTarget.ownerDocument),
        (link: string) => {
          props.insertItem(link);
        },
        source
      );
    }
  };
  return (
    <div
      className="mk-week-view-all-day-cell"
      ref={setNodeRef}
      onClick={onClick}
      style={
        {
          "--block-bg-color": applySat(40, "#0098FF"),
          "--block-color": "#0098FF",
          "--block-text-color": "var(--mk-ui-text-accent)",
          height: `${props.height * 24}px`,
        } as React.CSSProperties
      }
    >
      {props.children}
    </div>
  );
};
