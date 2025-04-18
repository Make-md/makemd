import { defaultMenu } from "core/react/components/UI/Menus/menu/SelectionMenu";
import { SelectOption, i18n } from "makemd-core";
import React from "react";
import { windowFromDocument } from "shared/utils/dom";
import { HoverSubmenuProps } from "./HoverSubmenuProps";
import { SizeSubmenu } from "./SizeSubmenu";
import { SpacingSubmenu } from "./SpacingSubmenu";

export const LayoutSubmenu = (props: HoverSubmenuProps) => {
  const { selectedNode, saveStyleValue } = props;
  const showImageSizeMenu = (e: React.MouseEvent, type: string) => {
    const prop = type == "icon" ? "iconSize" : "imageSize";
    const menuOptions: SelectOption[] = [];
    menuOptions.push({
      name: i18n.labels.styleSmall,
      icon: "type",
      onClick: () => {
        saveStyleValue(prop, `'s'`);
        // saveStyleValue("height", `'auto'`);
      },
    });
    menuOptions.push({
      name: i18n.labels.styleMedium,
      icon: "type",
      onClick: () => {
        saveStyleValue(prop, `'m'`);
        // saveStyleValue("height", `'auto'`);
      },
    });
    menuOptions.push({
      name: i18n.labels.styleLarge,
      icon: "type",
      onClick: () => {
        saveStyleValue(prop, `'l'`);
        // saveStyleValue("height", `'auto'`);
      },
    });
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      offset,
      defaultMenu(props.superstate.ui, menuOptions),
      windowFromDocument(e.view.document)
    );
  };
  return (
    <>
      <div className="mk-divider"></div>
      <SpacingSubmenu {...props}></SpacingSubmenu>
      <SizeSubmenu {...props}></SizeSubmenu>
      <div className="mk-divider"></div>
    </>
  );
};
