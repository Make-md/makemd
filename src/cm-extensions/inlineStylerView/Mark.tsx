import React from "react";
import t from "i18n";
import { platformIsMobile } from "utils/utils";
import { InlineStyle } from "./styles";
import { markIconSet } from "utils/icons";
export const Mark = (props: {
  i: number;
  style: InlineStyle;
  active: boolean;
  toggleMarkAction: (e: React.MouseEvent, s: InlineStyle) => void;
}) => {
  const { i, style, active, toggleMarkAction } = props;
  
  return (
    <div
      key={i}
      //@ts-ignore
      aria-label={!platformIsMobile() ? t.styles[style.label] : undefined}
      className={`mk-mark ${style.mark && active ? "mk-mark-active" : ""}`}
      dangerouslySetInnerHTML={{ __html: markIconSet[style.icon] }}
      onMouseDown={(e) => toggleMarkAction(e, style)}
    ></div>
  );
};
