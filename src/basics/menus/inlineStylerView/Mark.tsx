import MakeBasicsPlugin from "basics/basics";
import React from "react";
import { uiIconSet } from "shared/assets/icons";
import i18n from "shared/i18n";
import { InlineStyle } from "./styles";
export const Mark = (props: {
  plugin: MakeBasicsPlugin;
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
        !props.plugin.isTouchScreen()
          ? (i18n.styles as Record<string, string>)[style.label]
          : undefined
      }
      className={`mk-mark ${style.mark && active ? "mk-mark-active" : ""}`}
      dangerouslySetInnerHTML={{
        __html: uiIconSet[`${style.icon}`],
      }}
      onMouseDown={(e) => toggleMarkAction(e, style)}
    ></div>
  );
};
