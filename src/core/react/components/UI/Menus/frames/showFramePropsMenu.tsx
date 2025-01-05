import i18n from "shared/i18n";

import { removeQuotes, wrapQuotes } from "core/utils/strings";
import { SelectOption, Superstate } from "makemd-core";
import React from "react";
import { fieldTypeForType } from "schemas/mdb";
import { SpaceProperty } from "shared/types/mdb";
import { FrameNode, FrameTreeProp } from "shared/types/mframe";
import { Rect } from "shared/types/Pos";
import { colors } from "shared/utils/color";
import { windowFromDocument } from "shared/utils/dom";
import StickerModal from "../../../../../../shared/components/StickerModal";
import ImageModal from "../../Modals/ImageModal";
import { defaultMenu, menuInput, menuSeparator } from "../menu/SelectionMenu";
import {
  DatePickerTimeMode,
  showDatePickerMenu,
} from "../properties/datePickerMenu";
import { showLinkMenu } from "../properties/linkMenu";
import { showSpacesMenu } from "../properties/selectSpaceMenu";

type FramePropertyMenuProps = {
  superstate: Superstate;
  rect: Rect;
  win: Window;
  node: FrameNode;
  fields: SpaceProperty[];
  frameProps: FrameTreeProp;
  schemaProps: SpaceProperty[];
  deleteFrame: () => void;
  duplicateFrame: () => void;
  savePropValue: (prop: string, value: string) => void;
  saveStyleValue: (style: string, value: string) => void;
};
export const showFramePropsMenu = (props: FramePropertyMenuProps) => {
  const {
    superstate,
    rect,
    win,
    fields,
    deleteFrame,
    duplicateFrame,
    frameProps,
    savePropValue,
    saveStyleValue,
  } = props;

  const showValueMenu = (e: React.MouseEvent, field: SpaceProperty) => {
    const currentValue = removeQuotes(frameProps[field.name]);

    switch (field.type) {
      case "space":
        {
          const menuOptions: SelectOption[] = [];

          menuOptions.push({
            name: i18n.labels.selectSpace,
            icon: "ui//type",
            onClick: (e) => {
              const offset = (
                e.target as HTMLButtonElement
              ).getBoundingClientRect();
              showSpacesMenu(
                offset,
                windowFromDocument(e.view.document),
                props.superstate,
                (link: string) => savePropValue(field.name, wrapQuotes(link))
              );
            },
          });

          menuOptions.push(menuSeparator);

          props.schemaProps
            .filter((f) => f.type == field.type)
            .forEach((f) => {
              menuOptions.push({
                name: f.name,
                icon: "ui//type",
                onClick: () => {
                  savePropValue(field.name, `${f.schemaId}.props.${f.name}`);
                },
              });
            });
          const offset = (e.target as HTMLElement).getBoundingClientRect();
          props.superstate.ui.openMenu(
            offset,
            defaultMenu(props.superstate.ui, menuOptions),
            windowFromDocument(e.view.document)
          );
        }
        break;
      case "link":
        {
          const menuOptions: SelectOption[] = [];
          menuOptions.push({
            name: i18n.labels.selectNote,
            icon: "ui//type",
            onClick: (e) => {
              const offset = (
                e.target as HTMLButtonElement
              ).getBoundingClientRect();
              showLinkMenu(
                offset,
                windowFromDocument(e.view.document),
                props.superstate,
                (link: string) => savePropValue(field.name, wrapQuotes(link))
              );
              e.stopPropagation();
            },
          });
          menuOptions.push(menuSeparator);

          props.schemaProps
            .filter((f) => f.type == field.type)
            .forEach((f) => {
              menuOptions.push({
                name: f.name,
                icon: "ui//type",
                onClick: () => {
                  savePropValue(field.name, `${f.schemaId}.props.${f.name}`);
                },
              });
            });
          const offset = (e.target as HTMLElement).getBoundingClientRect();
          props.superstate.ui.openMenu(
            offset,
            defaultMenu(props.superstate.ui, menuOptions),
            windowFromDocument(e.view.document)
          );
        }
        break;
      case "icon":
        {
          props.superstate.ui.openPalette(
            <StickerModal
              ui={props.superstate.ui}
              selectedSticker={(emoji) =>
                savePropValue(field.name, wrapQuotes(emoji))
              }
            />,
            windowFromDocument(e.view.document)
          );
        }
        break;
      case "image":
        {
          props.superstate.ui.openPalette(
            <ImageModal
              superstate={props.superstate}
              selectedPath={(image) =>
                savePropValue(field.name, wrapQuotes(image))
              }
            ></ImageModal>,
            windowFromDocument(e.view.document)
          );
        }
        break;
      case "text":
      case "number":
        {
          const menuOptions: SelectOption[] = [];

          menuOptions.push(
            menuInput(currentValue, (value) =>
              savePropValue(field.name, wrapQuotes(value))
            )
          );

          props.schemaProps
            // .filter((f) => f.type == field.type)
            .forEach((f) => {
              menuOptions.push({
                name: f.name,
                icon: "ui//type",
                onClick: () => {
                  savePropValue(field.name, `${f.schemaId}.props.${f.name}`);
                },
              });
            });
          const offset = (e.target as HTMLElement).getBoundingClientRect();
          props.superstate.ui.openMenu(
            offset,
            defaultMenu(props.superstate.ui, menuOptions),
            windowFromDocument(e.view.document)
          );
        }
        break;
      case "date":
        {
          const offset = (e.target as HTMLElement).getBoundingClientRect();

          const date = new Date(currentValue);
          showDatePickerMenu(
            props.superstate.ui,
            offset,
            windowFromDocument(e.view.document),
            date.getTime() ? date : null,
            (date: Date) =>
              savePropValue(field.name, date.valueOf().toString()),
            DatePickerTimeMode.None
          );
          break;
        }

        break;
    }
  };

  const showTypographyMenu = (e: React.MouseEvent) => {
    const menuOptions: SelectOption[] = [];
    menuOptions.push({
      name: i18n.commands.h1,
      icon: "ui//type",
      onClick: (e) => savePropValue("style", `'h1'`),
    });
    menuOptions.push({
      name: i18n.commands.h2,
      icon: "ui//type",
      onClick: (e) => savePropValue("style", `'h2'`),
    });
    menuOptions.push({
      name: i18n.commands.h3,
      icon: "ui//type",
      onClick: (e) => savePropValue("style", `'h3'`),
    });
    menuOptions.push({
      name: i18n.commands.h4,
      icon: "ui//type",
      onClick: (e) => savePropValue("style", `'h4'`),
    });
    menuOptions.push({
      name: i18n.commands.h5,
      icon: "ui//type",
      onClick: (e) => savePropValue("style", `'h5'`),
    });
    menuOptions.push({
      name: i18n.commands.h6,
      icon: "ui//type",
      onClick: (e) => savePropValue("style", `'h6'`),
    });
    menuOptions.push({
      name: i18n.commands.paragraph,
      icon: "ui//type",
      onClick: (e) => savePropValue("style", `'p'`),
    });
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      offset,
      defaultMenu(props.superstate.ui, menuOptions),
      windowFromDocument(e.view.document)
    );
  };

  const menuOptions: SelectOption[] = [];

  if (props.node.type == "text") {
    menuOptions.push({
      name: i18n.labels.styles,
      icon: "ui//sort-asc",
      onClick: (e) => showTypographyMenu(e),
    });
    menuOptions.push({
      name: i18n.labels.color,
      icon: "ui//palette",
      onClick: (e) => {
        const offset = (e.target as HTMLElement).getBoundingClientRect();
        props.superstate.ui.openMenu(
          offset,
          {
            ui: props.superstate.ui,
            multi: false,
            editable: false,
            value: [],
            options: [
              { name: i18n.labels.default, value: "" },
              ...colors.map((f) => ({ name: f[0], value: f[1] })),
            ],
            saveOptions: (_, values) => {
              saveStyleValue("color", wrapQuotes(values[0]));
            },
            searchable: true,
            showAll: true,
          },
          windowFromDocument(e.view.document)
        );
      },
    });
    menuOptions.push({
      name: i18n.labels.backgroundColor,
      icon: "ui//palette",
      onClick: (e) => {
        const offset = (e.target as HTMLElement).getBoundingClientRect();
        props.superstate.ui.openMenu(
          offset,
          {
            ui: superstate.ui,
            multi: false,
            editable: false,
            value: [],
            options: [
              { name: i18n.labels.default, value: "" },
              ...colors.map((f) => ({ name: f[0], value: f[1] })),
            ],
            saveOptions: (_, values) => {
              saveStyleValue("background", wrapQuotes(values[0]));
            },
            searchable: true,
            showAll: true,
          },
          windowFromDocument(e.view.document)
        );
      },
    });
  }

  fields.forEach((f) =>
    menuOptions.push({
      name: f.name,
      icon: fieldTypeForType(f.type, f.name)?.icon,
      onClick: (e) => showValueMenu(e, f),
    })
  );
  menuOptions.push(menuSeparator);
  menuOptions.push({
    name: i18n.menu.duplicate,
    icon: "ui//copy",
    onClick: (e) => duplicateFrame(),
  });
  menuOptions.push({
    name: i18n.menu.delete,
    icon: "ui//trash",
    onClick: (e) => deleteFrame(),
  });

  return props.superstate.ui.openMenu(
    rect,
    defaultMenu(props.superstate.ui, menuOptions),
    win
  );
};
