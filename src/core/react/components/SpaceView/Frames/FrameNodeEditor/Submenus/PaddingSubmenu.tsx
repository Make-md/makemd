import { i18n } from "makemd-core";
import React from "react";
import { StepSetter } from "../../Setters/StepSetter";
import { HoverSubmenuProps } from "./HoverSubmenuProps";
export const PaddingSubmenu = (props: HoverSubmenuProps) => {
  const { selectedNode, saveStyleValue } = props;
  return (
    <>
      <StepSetter
        superstate={props.superstate}
        name={i18n.editor.paddingLeft}
        value={selectedNode.styles?.["paddingLeft"]}
        setValue={(value) => saveStyleValue("paddingLeft", value)}
        units={["px", "em"]}
      ></StepSetter>
      <StepSetter
        superstate={props.superstate}
        name={i18n.editor.paddingTop}
        min={0}
        value={selectedNode.styles?.["paddingTop"]}
        setValue={(value) => saveStyleValue("paddingTop", value)}
        units={["px", "em"]}
      ></StepSetter>
      <StepSetter
        superstate={props.superstate}
        name={i18n.editor.paddingRight}
        min={0}
        value={selectedNode.styles?.["paddingRight"]}
        setValue={(value) => saveStyleValue("paddingRight", value)}
        units={["px", "em"]}
      ></StepSetter>
      <StepSetter
        superstate={props.superstate}
        name={i18n.editor.paddingBottom}
        min={0}
        value={selectedNode.styles?.["paddingBottom"]}
        setValue={(value) => saveStyleValue("paddingBottom", value)}
        units={["px", "em"]}
      ></StepSetter>
    </>
  );
};
