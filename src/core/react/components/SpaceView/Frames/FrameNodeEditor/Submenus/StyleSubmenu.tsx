import { showColorPickerMenu } from "core/react/components/UI/Menus/properties/colorPickerMenu";
import { removeQuotes } from "core/utils/strings";
import { i18n } from "makemd-core";
import React from "react";
import { windowFromDocument } from "shared/utils/dom";
import { StepSetter } from "../../Setters/StepSetter";
import { BorderSubmenu } from "./BorderSubmenu";
import { HoverSubmenuProps } from "./HoverSubmenuProps";

export const StyleSubmenu = (props: HoverSubmenuProps) => {
  const { selectedNode, saveStyleValue } = props;
  const showColorMenu = (e: React.MouseEvent, prop: string) => {
    const handleChangeComplete = (color: string) => {
      saveStyleValue(prop, `'${color}'`);
    };
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    showColorPickerMenu(
      props.superstate,
      offset,
      windowFromDocument(e.view.document),
      removeQuotes(props.selectedNode.styles?.[prop]),
      handleChangeComplete
    );
  };

  return (
    <>
      <div
        style={{
          fontSize: "11px",
          color: "var(--mk-ui-text-tertiary)",
          marginRight: "4px",
        }}
      >
        {i18n.editor.fill}
      </div>
      <div
        className="mk-color"
        onClick={(e) => showColorMenu(e, "background")}
        style={{
          background: removeQuotes(props.selectedNode.styles?.["background"]),
        }}
      ></div>

      <BorderSubmenu {...props}></BorderSubmenu>

      {/* <div
        aria-label="Shadow"
        className="mk-editor-frame-node-button"
        onClick={(e) => showShadowMenu(e)}
      >
        <div
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//square"),
          }}
        ></div>
      </div> */}
      <StepSetter
        superstate={props.superstate}
        name={i18n.editor.opacity}
        min={0}
        max={100}
        value={selectedNode.styles?.["opacity"]}
        setValue={(value) => saveStyleValue("opacity", value)}
        units={["%"]}
      ></StepSetter>
    </>
  );
};
