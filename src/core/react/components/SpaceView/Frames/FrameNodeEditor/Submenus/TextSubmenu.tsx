import { showColorPickerMenu } from "core/react/components/UI/Menus/properties/colorPickerMenu";
import { listFonts } from "core/utils/fonts";
import { removeQuotes } from "core/utils/strings";
import { i18n } from "makemd-core";
import React from "react";
import { windowFromDocument } from "shared/utils/dom";
import { ColorSetter } from "../../Setters/ColorSetter";
import { StepSetter } from "../../Setters/StepSetter";
import { ToggleSetter } from "../../Setters/ToggleSetter";
import { HoverSubmenuProps } from "./HoverSubmenuProps";

export const TextSubmenu = (props: HoverSubmenuProps) => {
  const { selectedNode, saveStyleValue } = props;

  const showFontMenu = (e: React.MouseEvent) => {
    const options = listFonts().map((f) => ({ name: f, value: f }));
    props.superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        searchable: true,
        saveOptions: (_, v) => {
          saveStyleValue("--font-text", `'${v[0]}'`);
        },
        value: [selectedNode.styles?.["--font-text"] ?? ""],
        options: options,
      },
      windowFromDocument(e.view.document)
    );
  };

  const setAlign = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    e.preventDefault();
    saveStyleValue("textAlign", `'${value}'`);
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
      removeQuotes(props.selectedNode.styles?.[prop]),
      handleChangeComplete
    );
  };
  return (
    <>
      <div
        className="mk-editor-frame-node-button"
        onClick={(e) => showFontMenu(e)}
      >
        <div
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//type"),
          }}
        ></div>
        {selectedNode.styles?.["--font-text"]}
      </div>
      <div className="mk-divider"></div>
      <StepSetter
        superstate={props.superstate}
        name={i18n.editor.size}
        value={selectedNode.styles?.["--font-text-size"]}
        setValue={(value) => saveStyleValue("--font-text-size", value)}
        units={["px", "em"]}
      ></StepSetter>
      <ToggleSetter
        superstate={props.superstate}
        name={i18n.editor.bold}
        value={selectedNode.styles?.["--font-text-weight"]}
        defaultValue={"'normal'"}
        onValue={"'bold'"}
        icon={"ui//bold"}
        setValue={(value) => saveStyleValue("--font-text-weight", value)}
      ></ToggleSetter>
      <ToggleSetter
        superstate={props.superstate}
        name={i18n.editor.italic}
        value={selectedNode.styles?.["--font-text-style"]}
        defaultValue={"'normal'"}
        onValue={"'italic'"}
        icon={"ui//italic"}
        setValue={(value) => saveStyleValue("--font-text-style", value)}
      ></ToggleSetter>
      <ToggleSetter
        superstate={props.superstate}
        name={i18n.editor.underline}
        value={selectedNode.styles?.["--font-text-decoration"]}
        defaultValue={"'none'"}
        onValue={"'underline'"}
        icon={"ui//underline"}
        setValue={(value) => saveStyleValue("--font-text-decoration", value)}
      ></ToggleSetter>
      <ColorSetter
        superstate={props.superstate}
        value={removeQuotes(selectedNode.styles?.["--font-text-color"])}
        setValue={(value) => saveStyleValue("--font-text-color", `'${value}'`)}
      ></ColorSetter>
      <div className="mk-divider"></div>
      <ToggleSetter
        superstate={props.superstate}
        name={i18n.editor.alignLeft}
        value={selectedNode.styles?.["textAlign"]}
        defaultValue={"'left'"}
        onValue={"'left'"}
        icon={"ui//align-left"}
        setValue={(value) => saveStyleValue("textAlign", value)}
      ></ToggleSetter>
      <ToggleSetter
        superstate={props.superstate}
        name={i18n.editor.alignCenter}
        value={selectedNode.styles?.["textAlign"]}
        defaultValue={"'center'"}
        onValue={"'center'"}
        icon={"ui//align-center"}
        setValue={(value) => saveStyleValue("textAlign", value)}
      ></ToggleSetter>
      <ToggleSetter
        superstate={props.superstate}
        name={i18n.editor.alignRight}
        value={selectedNode.styles?.["textAlign"]}
        defaultValue={"'left'"}
        onValue={"'right'"}
        icon={"ui//align-right"}
        setValue={(value) => saveStyleValue("textAlign", value)}
      ></ToggleSetter>
      <ToggleSetter
        superstate={props.superstate}
        name={i18n.editor.alignJustify}
        value={selectedNode.styles?.["textAlign"]}
        defaultValue={"'left'"}
        onValue={"'justify'"}
        icon={"ui//align-justify"}
        setValue={(value) => saveStyleValue("textAlign", value)}
      ></ToggleSetter>
      <div className="mk-divider"></div>
      <StepSetter
        superstate={props.superstate}
        name={i18n.editor.numberOfLines}
        value={selectedNode.styles?.["--line-count"]}
        setValue={(value) => saveStyleValue("--line-count", value)}
        units={[""]}
      ></StepSetter>
    </>
  );
};
