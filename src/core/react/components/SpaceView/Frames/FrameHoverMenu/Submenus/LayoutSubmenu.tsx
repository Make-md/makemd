import i18n from "core/i18n";
import { SelectOption, defaultMenu } from "core/react/components/UI/Menus/menu";
import { removeQuotes } from "core/utils/strings";
import React from "react";
import { StepSetter } from "../../Setters/StepSetter";
import { HoverSubmenuProps } from "./HoverSubmenuProps";
export const LayoutSubmenu = (props: HoverSubmenuProps) => {
  const { selectedNode, saveStyleValue } = props;
  const showLayoutMenu = (e: React.MouseEvent) => {
    const menuOptions: SelectOption[] = [];
    menuOptions.push({
      name: i18n.commands.rows,
      icon: "lucide//layout",
      onClick: () => {
        saveStyleValue("layout", `'row'`);
      },
    });
    menuOptions.push({
      name: i18n.commands.columns,
      icon: "lucide//type",
      onClick: () => {
        saveStyleValue("layout", `'column'`);
      },
    });
    menuOptions.push({
      name: i18n.commands.masonry,
      icon: "lucide//type",
      onClick: () => {
        saveStyleValue("layout", `'masonry'`);
      },
    });

    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      { x: offset.left, y: offset.top + 30 },
      defaultMenu(props.superstate.ui, menuOptions)
    );
  };

  const setLayoutAlign = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    e.preventDefault();
    saveStyleValue("layoutAlign", `'${value}'`);
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
      <div className="mk-mark" onClick={(e) => showLayoutMenu(e)}>
        <div
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("lucide//case-sensitive"),
          }}
        ></div>
      </div>
      <div className="mk-divider"></div>
      <div
        className="mk-mark"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          saveStyleValue(
            "flexWrap",
            `${
              removeQuotes(selectedNode.styles.flexWrap) == "wrap"
                ? ""
                : `"wrap"`
            }`
          );
        }}
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("lucide//wrap-text"),
        }}
      ></div>
      <div
        className="mk-mark"
        onClick={(e) => setLayoutAlign(e, "left")}
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("lucide//align-left"),
        }}
      ></div>
      <div
        className="mk-mark"
        onClick={(e) => setLayoutAlign(e, "center")}
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("lucide//align-center"),
        }}
      ></div>
      <div
        className="mk-mark"
        onClick={(e) => setLayoutAlign(e, "right")}
        dangerouslySetInnerHTML={{
          __html: props.superstate.ui.getSticker("lucide//align-right"),
        }}
      ></div>

      <div className="mk-divider"></div>
      <StepSetter
        superstate={props.superstate}
        name={"Gap"}
        value={selectedNode.styles?.["gap"]}
        setValue={(value) => saveStyleValue("gap", value)}
        units={["px"]}
      ></StepSetter>
    </>
  );
};
