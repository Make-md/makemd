import React from "react";
import { StepSetter } from "../../Setters/StepSetter";
import { HoverSubmenuProps } from "./HoverSubmenuProps";
export const SizeSubmenu = (props: HoverSubmenuProps) => {
  const { selectedNode, saveStyleValue } = props;
  return (
    <>
      <div
        className="mk-mark"
        onMouseDown={() => {
          props.exitMenu();
        }}
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//mk-ui-close"),
        }}
      ></div>
      <div className="mk-divider"></div>
      <StepSetter
        superstate={props.superstate}
        name={"Width"}
        value={selectedNode.styles?.["width"]}
        setValue={(value) => saveStyleValue("width", value)}
        units={["px", "%", "em"]}
      ></StepSetter>
      <div className="mk-divider"></div>
      <StepSetter
        superstate={props.superstate}
        name={"Height"}
        value={selectedNode.styles?.["height"]}
        setValue={(value) => saveStyleValue("height", value)}
        units={["px", "%", "em"]}
      ></StepSetter>
    </>
  );
};
