import { i18n } from "makemd-core";
import React from "react";
import { StepSetter } from "../../Setters/StepSetter";
import { HoverSubmenuProps } from "./HoverSubmenuProps";
export const MarginSubmenu = (props: HoverSubmenuProps) => {
  const { selectedNode, saveStyleValue } = props;
  return (
    <>
      <StepSetter
        superstate={props.superstate}
        name={i18n.editor.marginLeft}
        value={selectedNode.styles?.["marginLeft"]}
        setValue={(value) => saveStyleValue("marginLeft", value)}
        units={["px", "em"]}
      ></StepSetter>
      <StepSetter
        superstate={props.superstate}
        name={i18n.editor.marginTop}
        value={selectedNode.styles?.["marginTop"]}
        setValue={(value) => saveStyleValue("marginTop", value)}
        units={["px", "em"]}
      ></StepSetter>
      <StepSetter
        superstate={props.superstate}
        name={i18n.editor.marginRight}
        value={selectedNode.styles?.["marginRight"]}
        setValue={(value) => saveStyleValue("marginRight", value)}
        units={["px", "em"]}
      ></StepSetter>
      <StepSetter
        superstate={props.superstate}
        name={i18n.editor.marginBottom}
        value={selectedNode.styles?.["marginBottom"]}
        setValue={(value) => saveStyleValue("marginBottom", value)}
        units={["px", "em"]}
      ></StepSetter>
    </>
  );
};
