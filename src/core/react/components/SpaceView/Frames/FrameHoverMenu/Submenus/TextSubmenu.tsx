import i18n from "core/i18n";
import { SelectOption, defaultMenu } from "core/react/components/UI/Menus/menu";
import { listFonts } from "core/utils/fonts";
import { removeQuotes } from "core/utils/strings";
import React from "react";
import { StepSetter } from "../../Setters/StepSetter";
import { HoverSubmenuProps } from "./HoverSubmenuProps";

export const TextSubmenu = (props: HoverSubmenuProps) => {
  const { selectedNode, saveStyleValue } = props;
  const showTypographyMenu = (e: React.MouseEvent) => {
    const menuOptions: SelectOption[] = [];
    menuOptions.push({
      name: i18n.commands.h1,
      icon: "lucide//type",
      onClick: () => {
        saveStyleValue("class", `'mk-t-h1'`);
      },
    });
    menuOptions.push({
      name: i18n.commands.h2,
      icon: "lucide//type",
      onClick: () => {
        saveStyleValue("class", `'mk-t-h2'`);
      },
    });
    menuOptions.push({
      name: i18n.commands.h3,
      icon: "lucide//type",
      onClick: () => {
        saveStyleValue("class", `'mk-t-h3'`);
      },
    });
    menuOptions.push({
      name: i18n.commands.h4,
      icon: "lucide//type",
      onClick: () => {
        saveStyleValue("class", `'mk-t-h4'`);
      },
    });
    menuOptions.push({
      name: i18n.commands.h5,
      icon: "lucide//type",
      onClick: () => {
        saveStyleValue("class", `'mk-t-h5'`);
      },
    });
    menuOptions.push({
      name: i18n.commands.h6,
      icon: "lucide//type",
      onClick: () => {
        saveStyleValue("class", `'mk-t-h6'`);
      },
    });
    menuOptions.push({
      name: i18n.commands.paragraph,
      icon: "lucide//type",
      onClick: () => {
        saveStyleValue("class", `'mk-t-p'`);
      },
    });
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      { x: offset.left, y: offset.top + 30 },
      defaultMenu(props.superstate.ui, menuOptions)
    );
  };

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
      }
    );
  };

  const setAlign = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    e.preventDefault();
    saveStyleValue("textAlign", `'${value}'`);
  };
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
      <div className="mk-mark" onClick={(e) => showTypographyMenu(e)}>
        <div
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("lucide//case-sensitive"),
          }}
        ></div>
        Type
      </div>
      <div className="mk-mark" onClick={(e) => showFontMenu(e)}>
        <div
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("lucide//type"),
          }}
        ></div>
        Font
      </div>
      <div className="mk-divider"></div>
      <StepSetter
        superstate={props.superstate}
        name={"Line Count"}
        value={selectedNode.styles?.["--line-count"]}
        setValue={(value) => saveStyleValue("--line-count", value)}
        units={[""]}
      ></StepSetter>
      <StepSetter
        superstate={props.superstate}
        name={"Size"}
        value={selectedNode.styles?.["--font-text-size"]}
        setValue={(value) => saveStyleValue("--font-text-size", value)}
        units={["px", "em"]}
      ></StepSetter>
      <div
        className="mk-mark"
        onClick={(e) => setAlign(e, "left")}
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("lucide//align-left"),
        }}
      ></div>
      <div
        className="mk-mark"
        onClick={(e) => setAlign(e, "center")}
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("lucide//align-center"),
        }}
      ></div>
      <div
        className="mk-mark"
        onClick={(e) => setAlign(e, "right")}
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("lucide//align-right"),
        }}
      ></div>
      <div className="mk-divider"></div>
      <div
        className="mk-color"
        style={{ background: removeQuotes(selectedNode.styles?.["color"]) }}
      ></div>
    </>
  );
};
