import { Superstate } from "makemd-core";
import React from "react";
export const CollapseToggle = (props: {
  superstate: Superstate;
  collapsed: boolean;
  onToggle?: (collapsed: boolean, e: React.MouseEvent) => void;
}) => {
  return (
    <button
      className={`mk-collapse ${props.collapsed ? "mk-collapsed" : ""}`}
      onClick={(e) => {
        if (!props.onToggle) return;
        e.stopPropagation();
        props.onToggle(!props.collapsed, e);
      }}
      dangerouslySetInnerHTML={{
        __html: props.superstate.ui.getSticker("ui//collapse"),
      }}
    ></button>
  );
};
