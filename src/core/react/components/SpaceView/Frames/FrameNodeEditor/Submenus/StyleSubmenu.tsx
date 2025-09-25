import { defaultMenu } from "core/react/components/UI/Menus/menu/SelectionMenu";
import { showColorPickerMenu } from "core/react/components/UI/Menus/properties/colorPickerMenu";
import { removeQuotes } from "core/utils/strings";
import { SelectOption, i18n } from "makemd-core";
import React from "react";
import { windowFromDocument } from "shared/utils/dom";
import { StepSetter } from "../../Setters/StepSetter";
import { BorderSubmenu } from "./BorderSubmenu";
import { HoverSubmenuProps } from "./HoverSubmenuProps";

export const StyleSubmenu = (props: HoverSubmenuProps) => {
  const { selectedNode, saveStyleValue, styleState } = props;

  // Helper function to get the correct property name with state prefix
  const getStateProp = (prop: string) => {
    return styleState ? `${styleState}:${prop}` : prop;
  };

  // Helper function to get the current value for a property (with or without state)
  const getStyleValue = (prop: string) => {
    const stateProp = getStateProp(prop);
    return (
      props.selectedNode.styles?.[stateProp] ||
      props.selectedNode.styles?.[prop]
    );
  };

  const showColorMenu = (e: React.MouseEvent, prop: string) => {
    const handleChangeComplete = (color: string) => {
      saveStyleValue(getStateProp(prop), `'${color}'`);
    };
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    showColorPickerMenu(
      props.superstate,
      offset,
      windowFromDocument(e.view.document),
      removeQuotes(getStyleValue(prop)),
      handleChangeComplete
    );
  };


  return (
    <>
      <div
        className="mk-editor-frame-node-button-back"
        aria-label="Back"
        onMouseDown={(e) => {
          props.exitMenu(e);
        }}
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("ui//arrow-left"),
        }}
      ></div>

      <div className="mk-frame-submenu-label">{i18n.editor.fill}</div>
      <div
        className="mk-editor-frame-color"
        onClick={(e) => showColorMenu(e, "background")}
        style={{
          background: removeQuotes(getStyleValue("background")),
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
        value={getStyleValue("opacity")}
        setValue={(value) => saveStyleValue(getStateProp("opacity"), value)}
        units={["%"]}
      ></StepSetter>
    </>
  );
};
