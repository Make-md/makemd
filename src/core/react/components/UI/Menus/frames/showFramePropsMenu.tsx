import i18n from "core/i18n";

import { Superstate } from "core/superstate/superstate";
import { removeQuotes, wrapQuotes } from "core/utils/strings";
import React from "react";
import { colors } from "schemas/color";
import { fieldTypeForType } from "schemas/mdb";
import { Pos } from "types/Pos";
import { SpaceProperty } from "types/mdb";
import { FrameNode, FrameTreeProp } from "types/mframe";
import ImageModal from "../../Modals/ImageModal";
import StickerModal from "../../Modals/StickerModal";
import { SelectOption, defaultMenu, menuInput, menuSeparator } from "../menu";
import { showDatePickerMenu } from "../properties/datePickerMenu";
import { showLinkMenu } from "../properties/linkMenu";
import { showSpacesMenu } from "../properties/selectSpaceMenu";

type FramePropertyMenuProps = {
  superstate: Superstate;
  position: Pos;
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
    position,
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
            icon: "lucide//type",
            onClick: (e) =>
              showSpacesMenu(e, props.superstate, (link: string) =>
                savePropValue(field.name, wrapQuotes(link))
              ),
          });

          menuOptions.push(menuSeparator);

          props.schemaProps
            .filter((f) => f.type == field.type)
            .forEach((f) => {
              menuOptions.push({
                name: f.name,
                icon: "lucide//type",
                onClick: () => {
                  savePropValue(field.name, `${f.schemaId}.props.${f.name}`);
                },
              });
            });
          const offset = (e.target as HTMLElement).getBoundingClientRect();
          props.superstate.ui.openMenu(
            { x: offset.left, y: offset.top + 30 },
            defaultMenu(props.superstate.ui, menuOptions)
          );
        }
        break;
      case "link":
        {
          const menuOptions: SelectOption[] = [];
          menuOptions.push({
            name: i18n.labels.selectNote,
            icon: "lucide//type",
            onClick: (e) =>
              showLinkMenu(e, props.superstate, (link: string) =>
                savePropValue(field.name, wrapQuotes(link))
              ),
          });
          menuOptions.push(menuSeparator);

          props.schemaProps
            .filter((f) => f.type == field.type)
            .forEach((f) => {
              menuOptions.push({
                name: f.name,
                icon: "lucide//type",
                onClick: () => {
                  savePropValue(field.name, `${f.schemaId}.props.${f.name}`);
                },
              });
            });
          const offset = (e.target as HTMLElement).getBoundingClientRect();
          props.superstate.ui.openMenu(
            { x: offset.left, y: offset.top + 30 },
            defaultMenu(props.superstate.ui, menuOptions)
          );
        }
        break;
      case "icon":
        {
          props.superstate.ui.openPalette((_props: { hide: () => void }) => (
            <StickerModal
              ui={props.superstate.ui}
              hide={_props.hide}
              selectedSticker={(emoji) =>
                savePropValue(field.name, wrapQuotes(emoji))
              }
            />
          ));
        }
        break;
      case "image":
        {
          props.superstate.ui.openPalette((_props: { hide: () => void }) => (
            <ImageModal
              superstate={props.superstate}
              hide={_props.hide}
              selectedPath={(image) =>
                savePropValue(field.name, wrapQuotes(image))
              }
            ></ImageModal>
          ));
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
                icon: "lucide//type",
                onClick: () => {
                  savePropValue(field.name, `${f.schemaId}.props.${f.name}`);
                },
              });
            });
          const offset = (e.target as HTMLElement).getBoundingClientRect();
          props.superstate.ui.openMenu(
            { x: offset.left, y: offset.top + 30 },
            defaultMenu(props.superstate.ui, menuOptions)
          );
        }
        break;
      case "date":
        {
          const offset = (e.target as HTMLElement).getBoundingClientRect();
          const date = new Date(currentValue);
          showDatePickerMenu(
            props.superstate.ui,
            { x: offset.left, y: offset.top + 30 },
            date.getTime() ? date : null,
            (date: Date) => savePropValue(field.name, date.valueOf().toString())
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
      icon: "lucide//type",
      onClick: (e) => savePropValue("style", `'h1'`),
    });
    menuOptions.push({
      name: i18n.commands.h2,
      icon: "lucide//type",
      onClick: (e) => savePropValue("style", `'h2'`),
    });
    menuOptions.push({
      name: i18n.commands.h3,
      icon: "lucide//type",
      onClick: (e) => savePropValue("style", `'h3'`),
    });
    menuOptions.push({
      name: i18n.commands.h4,
      icon: "lucide//type",
      onClick: (e) => savePropValue("style", `'h4'`),
    });
    menuOptions.push({
      name: i18n.commands.h5,
      icon: "lucide//type",
      onClick: (e) => savePropValue("style", `'h5'`),
    });
    menuOptions.push({
      name: i18n.commands.h6,
      icon: "lucide//type",
      onClick: (e) => savePropValue("style", `'h6'`),
    });
    menuOptions.push({
      name: i18n.commands.paragraph,
      icon: "lucide//type",
      onClick: (e) => savePropValue("style", `'p'`),
    });
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      { x: offset.left, y: offset.top + 30 },
      defaultMenu(props.superstate.ui, menuOptions)
    );
  };

  const menuOptions: SelectOption[] = [];

  if (props.node.type == "text") {
    menuOptions.push({
      name: i18n.labels.styles,
      icon: "lucide//sort-asc",
      onClick: (e) => showTypographyMenu(e),
    });
    menuOptions.push({
      name: i18n.labels.color,
      icon: "lucide//palette",
      onClick: (e) => {
        const offset = (e.target as HTMLElement).getBoundingClientRect();
        props.superstate.ui.openMenu(
          { x: offset.left, y: offset.top + 30 },
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
          }
        );
      },
    });
    menuOptions.push({
      name: i18n.labels.backgroundColor,
      icon: "lucide//palette",
      onClick: (e) => {
        const offset = (e.target as HTMLElement).getBoundingClientRect();
        props.superstate.ui.openMenu(
          { x: offset.left, y: offset.top + 30 },
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
          }
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
    icon: "lucide//copy",
    onClick: (e) => duplicateFrame(),
  });
  menuOptions.push({
    name: i18n.menu.delete,
    icon: "lucide//trash",
    onClick: (e) => deleteFrame(),
  });

  return props.superstate.ui.openMenu(
    position,
    defaultMenu(props.superstate.ui, menuOptions)
  );
};
