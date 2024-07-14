import { Superstate } from "makemd-core";
import React from "react";
export const CollapseToggleSmall = (props: {
  superstate: Superstate;
  collapsed: boolean;
  onToggle?: (collapsed: boolean, e: React.MouseEvent) => void;
}) => {
  return (
    <button
      className={`mk-collapse mk-inline-button mk-icon-xsmall ${
        props.collapsed ? "mk-collapsed" : ""
      }`}
      onClick={(e) => {
        if (props.onToggle) {
          props.onToggle(!props.collapsed, e);
          e.stopPropagation();
        }
      }}
      dangerouslySetInnerHTML={{
        __html: props.superstate.ui.getSticker("ui//collapse-solid"),
      }}
    ></button>
  );
};
