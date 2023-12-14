import { uiIconSet } from "adapters/obsidian/ui/icons";
import MakeMDPlugin from "main";
import { i18n } from "makemd-core";
import React from "react";
import { InlineStyle } from "./styles";
export const Mark = (props: {
  plugin: MakeMDPlugin;
  i: number;
  style: InlineStyle;
  active: boolean;
  toggleMarkAction: (e: React.MouseEvent, s: InlineStyle) => void;
}) => {
  const { i, style, active, toggleMarkAction } = props;

  return (
    <div
      key={i}
      aria-label={
        props.plugin.superstate.ui.getScreenType() != "mobile"
          ? (i18n.styles as Record<string, string>)[style.label]
          : undefined
      }
      className={`mk-mark ${style.mark && active ? "mk-mark-active" : ""}`}
      dangerouslySetInnerHTML={{ __html: uiIconSet[style.icon] }}
      onMouseDown={(e) => toggleMarkAction(e, style)}
    ></div>
  );
};
