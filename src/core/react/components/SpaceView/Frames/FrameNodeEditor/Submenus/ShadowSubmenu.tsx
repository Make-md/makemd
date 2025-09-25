import { showColorPickerMenu } from "core/react/components/UI/Menus/properties/colorPickerMenu";
import { removeQuotes } from "core/utils/strings";
import { i18n } from "makemd-core";
import React from "react";
import { hexToRgb } from "core/utils/colorPalette";
import { windowFromDocument } from "shared/utils/dom";
import { StepSetter } from "../../Setters/StepSetter";
import { HoverSubmenuProps } from "./HoverSubmenuProps";

export const ShadowSubmenu = (props: HoverSubmenuProps) => {
  const { selectedNode, saveStyleValue } = props;

  const showColorMenu = (e: React.MouseEvent, prop: string) => {
    const handleChangeComplete = (color: string) => {
      const { r, g, b } = hexToRgb(color);
      saveStyleValue(prop, `'${r},${g},${b}'`);
    };
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    showColorPickerMenu(
      props.superstate,
      offset,
      windowFromDocument(e.view.document),
      removeQuotes(selectedNode.styles?.[prop]),
      handleChangeComplete
    );
  };
  return (
    <>
      <div
        className="mk-editor-frame-node-button"
        onMouseDown={() => {
          props.exitMenu({} as React.MouseEvent);
        }}
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//close"),
        }}
      ></div>
      <div className="mk-divider"></div>

      <StepSetter
        superstate={props.superstate}
        name={"X"}
        value={selectedNode.styles?.["--shadow-x"]}
        setValue={(value) => saveStyleValue("--shadow-x", value)}
        units={["px", "em"]}
      ></StepSetter>
      <StepSetter
        superstate={props.superstate}
        name={"Y"}
        value={selectedNode.styles?.["--shadow-y"]}
        setValue={(value) => saveStyleValue("--shadow-y", value)}
        units={["px", "em"]}
      ></StepSetter>
      <StepSetter
        superstate={props.superstate}
        name={i18n.editor.shadowBlur}
        value={selectedNode.styles?.["--shadow-blur"]}
        setValue={(value) => saveStyleValue("--shadow-blur", value)}
        units={["px", "em"]}
      ></StepSetter>
      <StepSetter
        superstate={props.superstate}
        name={i18n.editor.shadowSpread}
        value={selectedNode.styles?.["--shadow-spread"]}
        setValue={(value) => saveStyleValue("--shadow-spread", value)}
        units={["px", "em"]}
      ></StepSetter>

      <div className="mk-divider"></div>
      <div
        onClick={(e) => {
          showColorMenu(e, "--shadow-color");
        }}
        className="mk-color"
        style={{
          background: removeQuotes(selectedNode.styles?.["--shadow-color"]),
        }}
      ></div>
      <StepSetter
        superstate={props.superstate}
        name={i18n.editor.opacity}
        value={selectedNode.styles?.["--shadow-alpha"]}
        setValue={(value) => saveStyleValue("--shadow-alpha", value.toString())}
        min={0}
        units={[""]}
      ></StepSetter>
    </>
  );
};
