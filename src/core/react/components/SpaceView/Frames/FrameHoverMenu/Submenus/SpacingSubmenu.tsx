import React from "react";
import { StepSetter } from "../../Setters/StepSetter";
import { HoverSubmenuProps } from "./HoverSubmenuProps";
export const SpacingSubmenu = (props: HoverSubmenuProps) => {
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
      <StepSetter
        superstate={props.superstate}
        name={"Margin"}
        value={selectedNode.styles?.["margin"]}
        setValue={(value) => saveStyleValue("margin", value)}
        units={["px", "em"]}
      ></StepSetter>
      <StepSetter
        superstate={props.superstate}
        name={"Padding"}
        value={selectedNode.styles?.["padding"]}
        setValue={(value) => saveStyleValue("padding", value)}
        units={["px", "em"]}
      ></StepSetter>
    </>
  );
};
