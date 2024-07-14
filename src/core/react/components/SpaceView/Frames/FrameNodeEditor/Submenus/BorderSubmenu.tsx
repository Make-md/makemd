import {
  SelectOption,
  defaultMenu,
} from "core/react/components/UI/Menus/menu/SelectionMenu";
import { showColorPickerMenu } from "core/react/components/UI/Menus/properties/colorPickerMenu";
import { removeQuotes } from "core/utils/strings";
import { i18n } from "makemd-core";
import React from "react";
import { windowFromDocument } from "utils/dom";
import { StepSetter } from "../../Setters/StepSetter";
import { HoverSubmenuProps } from "./HoverSubmenuProps";

export const BorderSubmenu = (props: HoverSubmenuProps) => {
  const { selectedNode, saveStyleValue } = props;
  const showOutlineStyleMenu = (e: React.MouseEvent) => {
    const menuOptions: SelectOption[] = [];
    menuOptions.push({
      name: i18n.editor.strokeNone,
      icon: "ui//type",
      onClick: () => {
        saveStyleValue("outlineStyle", `'none'`);
      },
    });
    menuOptions.push({
      name: i18n.editor.strokeSolid,
      icon: "ui//type",
      onClick: () => {
        saveStyleValue("outlineStyle", `'solid'`);
      },
    });
    menuOptions.push({
      name: i18n.editor.strokeDashed,
      icon: "ui//type",
      onClick: () => {
        saveStyleValue("outlineStyle", `'dashed'`);
      },
    });
    menuOptions.push({
      name: i18n.editor.strokeDotted,
      icon: "ui//type",
      onClick: () => {
        saveStyleValue("outlineStyle", `'dotted'`);
      },
    });

    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      offset,
      defaultMenu(props.superstate.ui, menuOptions),
      windowFromDocument(e.view.document)
    );
  };

  const showColorMenu = (e: React.MouseEvent, prop: string) => {
    const handleChangeComplete = (color: string) => {
      saveStyleValue(prop, `'${color}'`);
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
      <div className="mk-divider"></div>

      <div
        className="mk-editor-frame-node-button"
        onClick={(e) => showOutlineStyleMenu(e)}
      >
        <div
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//case-sensitive"),
          }}
        ></div>
        {props.state.styles?.["outlineStyle"] ?? i18n.labels.none}
      </div>

      <StepSetter
        superstate={props.superstate}
        name={i18n.editor.size}
        value={props.state.styles?.["outlineWidth"]}
        setValue={(value) => saveStyleValue("outlineWidth", value)}
        units={["px", "em"]}
      ></StepSetter>

      <div
        onClick={(e) => {
          showColorMenu(e, "outlineColor");
        }}
        className="mk-color"
        style={{
          background: props.state.styles?.["outlineColor"],
        }}
      ></div>
    </>
  );
};
