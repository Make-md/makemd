import { uiIconSet } from "core/assets/icons";
import React from "react";
export const UICollapse = (props: {
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
        __html: uiIconSet["collapse"],
      }}
    ></button>
  );
};
