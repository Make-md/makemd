import i18n from "shared/i18n";
import React from "react";
import { windowFromDocument } from "shared/utils/dom";
import { StepSetter } from "../../Setters/StepSetter";
import { HoverSubmenuProps } from "./HoverSubmenuProps";
import { MarginSubmenu } from "./MarginSubmenu";
import { PaddingSubmenu } from "./PaddingSubmenu";
export const SpacingSubmenu = (props: HoverSubmenuProps) => {
  const { selectedNode, saveStyleValue } = props;
  const showPaddingMenu = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    return props.superstate.ui.openCustomMenu(
      offset,
      <PaddingSubmenu {...props}></PaddingSubmenu>,
      props,
      windowFromDocument(e.view.document)
    );
  };
  const showMarginMenu = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    return props.superstate.ui.openCustomMenu(
      offset,
      <MarginSubmenu {...props}></MarginSubmenu>,
      props,
      windowFromDocument(e.view.document)
    );
  };

  return (
    <>
      <StepSetter
        superstate={props.superstate}
        name={i18n.editor.margin}
        value={selectedNode.styles?.["margin"]}
        setValue={(value) => saveStyleValue("margin", value)}
        units={["px", "em"]}
      ></StepSetter>
      <div
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//options"),
        }}
        onClick={(e) => {
          showMarginMenu(e);
        }}
      ></div>
      <StepSetter
        superstate={props.superstate}
        name={i18n.editor.padding}
        min={0}
        value={selectedNode.styles?.["padding"]}
        setValue={(value) => saveStyleValue("padding", value)}
        units={["px", "em"]}
      ></StepSetter>
      <div
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//plus"),
        }}
        onClick={(e) => {
          showPaddingMenu(e);
        }}
      ></div>
    </>
  );
};
