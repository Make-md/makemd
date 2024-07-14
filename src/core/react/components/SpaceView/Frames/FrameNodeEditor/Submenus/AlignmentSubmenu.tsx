import { wrapQuotes } from "core/utils/strings";
import React, { useState } from "react";
import { HoverSubmenuProps } from "./HoverSubmenuProps";

export const AlignmentEditor = (props: HoverSubmenuProps) => {
  const directions = ["nw", "n", "ne", "w", "m", "e", "sw", "s", "se"];
  const [layoutAlign, setLayoutAlign] = useState(
    props.state?.styles?.layoutAlign
  );
  return (
    <div className="mk-editor-alignment-menu">
      {directions.map((d) => (
        <div
          className={`mk-editor-alignment-selector ${
            layoutAlign == d && "mk-active"
          }`}
          key="d"
          onClick={() => {
            setLayoutAlign(d);
            props.saveStyleValue("layoutAlign", wrapQuotes(d));
          }}
        ></div>
      ))}
    </div>
  );
};
