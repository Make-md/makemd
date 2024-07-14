import { i18n } from "makemd-core";
import React from "react";
import { StepSetter } from "../../Setters/StepSetter";
import { HoverSubmenuProps } from "./HoverSubmenuProps";
export const SizeSubmenu = (props: HoverSubmenuProps) => {
  const { selectedNode, saveStyleValue } = props;
  return (
    <>
      <div className="mk-divider"></div>
      <StepSetter
        superstate={props.superstate}
        name={i18n.editor.width}
        min={0}
        value={selectedNode.styles?.["width"]}
        setValue={(value) => saveStyleValue("width", value)}
        units={["px", "%", "em"]}
      ></StepSetter>
      <div className="mk-divider"></div>
      <StepSetter
        superstate={props.superstate}
        name={i18n.editor.height}
        min={0}
        value={selectedNode.styles?.["height"]}
        setValue={(value) => saveStyleValue("height", value)}
        units={["px", "%", "em"]}
      ></StepSetter>
    </>
  );
};
