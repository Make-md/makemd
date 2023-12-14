import i18n from "core/i18n";
import {
  SelectOption,
  defaultMenu,
  menuInput,
} from "core/react/components/UI/Menus/menu";
import { showDatePickerMenu } from "core/react/components/UI/Menus/properties/datePickerMenu";
import { showLinkMenu } from "core/react/components/UI/Menus/properties/linkMenu";
import { showSpacesMenu } from "core/react/components/UI/Menus/properties/selectSpaceMenu";
import React, { useContext, useEffect, useMemo, useState } from "react";

import ImageModal from "core/react/components/UI/Modals/ImageModal";
import StickerModal from "core/react/components/UI/Modals/StickerModal";
import { FramesEditorContext } from "core/react/context/FrameEditorContext";
import { parseFieldValue } from "core/schemas/parseFieldValue";
import { Superstate } from "core/superstate/superstate";
import {
  nameForField,
  propFieldFromString,
  stringIsConst,
} from "core/utils/frames/frames";
import { removeQuotes, wrapQuotes } from "core/utils/strings";
import { defaultContextSchemaID, stickerForField } from "schemas/mdb";
import { SpaceProperty } from "types/mdb";
import { FrameNode } from "types/mframe";
import { safelyParseJSON } from "utils/parsers";
import { HoverSubmenuProps } from "./Submenus/HoverSubmenuProps";
import { LayoutSubmenu } from "./Submenus/LayoutSubmenu";
import { SizeSubmenu } from "./Submenus/SizeSubmenu";
import { SpacingSubmenu } from "./Submenus/SpacingSubmenu";
import { TextSubmenu } from "./Submenus/TextSubmenu";

export enum HoverEditMode {
  EditModeDefault = 0,
  EditModeText = 1,
  EditModeLayout = 2,
  EditModeSize = 3,
  EditModeSpacing = 4,
}

export const HoverPropsMenu = (props: {
  superstate: Superstate;

  fields: SpaceProperty[];
  node: FrameNode;
  schemaProps: SpaceProperty[];
  triggerMenu: (e: React.MouseEvent) => void;
  deleteFrame: () => void;
  duplicateFrame: () => void;
}) => {
  const { deleteFrame, duplicateFrame } = props;

  const { ungroupNode, nodes, saveNodes, moveUp, moveDown } =
    useContext(FramesEditorContext);
  const saveNodeValue = (
    values: { [key: string]: string },
    node: FrameNode
  ) => {
    const newNodes = {
      ...node,
      props: {
        ...node.props,
        ...values,
      },
    };
    saveNodes([newNodes]);
  };
  const saveStyleValue = (prop: string, value: string) => {
    const newNodes = {
      ...selectedNode,
      styles: {
        ...selectedNode.styles,
        ...{ [prop]: value },
      },
    };

    saveNodes([newNodes]);
  };
  const [editMode, setEditMode] = useState(HoverEditMode.EditModeDefault);
  const [frameProps, setFrameProps] = useState(props.node.props);

  const [selectedNode, setSelectedNode] = useState(props.node);

  const fields = useMemo(() => {
    return Object.keys(selectedNode.types).map((f) => ({
      type: selectedNode.types[f],
      name: f,
      attrs: selectedNode.propsAttrs?.[f],
      schemaId: selectedNode.schemaId,
      value: selectedNode.propsValue?.[f],
    }));
  }, [selectedNode]);
  const showSelectNodeMenu = (e: React.MouseEvent) => {
    const offset = (e.target as HTMLButtonElement).getBoundingClientRect();
    const options = nodes
      .filter((f) => f.parentId == selectedNode.id)
      .map((f) => ({
        name: f.name,
        value: f.id,
      }));
    props.superstate.ui.openMenu(
      { x: offset.left, y: offset.top + 30 },
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        value: [],
        options,
        saveOptions: (_: string[], value: string[]) => {
          setSelectedNode(nodes.find((f) => f.id == value[0]));
        },
        placeholder: i18n.labels.linkItemSelectPlaceholder,
        detail: true,
        searchable: false,
        showAll: true,
      }
    );
  };
  useEffect(() => {
    if (props.node.type == "group") {
      if (selectedNode.parentId == props.node.id) return;
    }
    setSelectedNode(props.node);
  }, [props.node]);
  useEffect(() => {
    setFrameProps(selectedNode.props);
  }, [selectedNode]);

  const savePropValue = (prop: string, value: string) => {
    setFrameProps((p) => ({ ...p, [prop]: value }));
    saveNodeValue({ [prop]: value }, selectedNode);
  };

  const showPropsMenu = (e: React.MouseEvent, field: SpaceProperty) => {
    e.stopPropagation();
    e.preventDefault();
    const menuOptions: SelectOption[] = [];

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
  };
  const showValueMenu = (e: React.MouseEvent, field: SpaceProperty) => {
    e.stopPropagation();
    e.preventDefault();
    const currentValue = removeQuotes(frameProps[field.name]);
    switch (field.type) {
      case "space":
        {
          showSpacesMenu(e, props.superstate, (link: string) =>
            savePropValue(
              field.name,
              wrapQuotes(link + "#^" + defaultContextSchemaID)
            )
          );
        }
        break;
      case "option":
        {
          const parsedValue = parseFieldValue(field.value, field.type);

          const options = parsedValue.options ?? [];
          props.superstate.ui.openMenu(
            (e.target as HTMLElement).getBoundingClientRect(),
            {
              ui: props.superstate.ui,
              multi: false,
              editable: false,
              searchable: true,
              saveOptions: (_, v) => {
                savePropValue(field.name, `'${v[0]}'`);
              },
              value: [currentValue ?? ""],
              options: options,
            }
          );
        }
        break;
      case "link":
        {
          showLinkMenu(e as any, props.superstate, (link: string) =>
            savePropValue(field.name, wrapQuotes(link))
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

          const offset = (e.target as HTMLElement).getBoundingClientRect();
          props.superstate.ui.openMenu(
            { x: offset.left, y: offset.top + 30 },
            defaultMenu(props.superstate.ui, menuOptions)
          );
        }
        break;
      case "date": {
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
      case "super":
        {
          const parsedValue = parseFieldValue(field.value, field.type);
          const superPropertyName = parsedValue.dynamic
            ? removeQuotes(frameProps[parsedValue.field ?? ""])
            : parsedValue.field;

          if (superPropertyName) {
            const property =
              props.superstate.superProperties.get(superPropertyName);

            const superProperty = property
              ? {
                  ...property,
                  name: field.name,
                  value: JSON.stringify(
                    props.superstate.valueForSuperproperty(
                      superPropertyName,
                      property
                    )
                  ),
                }
              : null;
            if (superProperty) showValueMenu(e, superProperty);
          }
          break;
        }
        break;
    }
  };

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
      { x: offset.left, y: offset.top + 30 },
      defaultMenu(props.superstate.ui, menuOptions)
    );
  };

  const submenuProps: HoverSubmenuProps = {
    superstate: props.superstate,
    exitMenu: () => setEditMode(0),
    saveStyleValue: saveStyleValue,
    selectedNode: selectedNode,
  };
  return (
    <div className="mk-frame-props-editor menu">
      {editMode == HoverEditMode.EditModeDefault ? (
        <>
          {fields.map((f, i) => (
            <>
              <div
                className="mk-mark"
                key={i}
                onClick={(e) => showValueMenu(e, f)}
              >
                <div
                  aria-label={safelyParseJSON(f.attrs)?.name ?? f.name}
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker(stickerForField(f)),
                  }}
                ></div>
                {!stringIsConst(frameProps?.[f.name]) ? (
                  <div className="mk-mark-prop">
                    {nameForField(
                      propFieldFromString(
                        frameProps?.[f.name],
                        props.schemaProps
                      )
                    )}
                  </div>
                ) : (
                  <></>
                )}
                {f.type == "icon" && (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: props.superstate.ui.getSticker(
                        removeQuotes(frameProps?.[f.name])
                      ),
                    }}
                  ></div>
                )}
                {(f.type == "text" || f.type == "number") &&
                  stringIsConst(frameProps?.[f.name]) && (
                    <div className="mk-menu-input">
                      <input
                        value={removeQuotes(frameProps?.[f.name])}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key == "Enter")
                            (e.target as HTMLInputElement).blur();
                        }}
                        onBlur={(e) => {
                          savePropValue(f.name, wrapQuotes(e.target.value));
                        }}
                      ></input>
                    </div>
                  )}
              </div>
              {selectedNode.type == "flow" && (
                <div
                  className="mk-mark"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    props.triggerMenu && props.triggerMenu(e);
                  }}
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker("ui//mk-ui-options"),
                  }}
                ></div>
              )}
              <div
                className="mk-mark-option"
                key={i}
                onClick={(e) => showPropsMenu(e, f)}
              >
                <div
                  aria-label={"Select Property"}
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker("ui//mk-ui-props"),
                  }}
                ></div>
              </div>
              <div className="mk-divider"></div>
            </>
          ))}
          {selectedNode.type == "space" ? (
            <>
              <div
                className="mk-mark"
                aria-label="Toggle Filter Bar"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  savePropValue(
                    "minMode",
                    `${selectedNode.props.minMode == "true" ? "false" : "true"}`
                  );
                }}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("lucide//minimize-2"),
                }}
              ></div>
            </>
          ) : (
            <></>
          )}

          {selectedNode.type == "text" || selectedNode.type == "flow" ? (
            <>
              <div
                aria-label="Text Style"
                className="mk-mark"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditMode(HoverEditMode.EditModeText);
                }}
                dangerouslySetInnerHTML={{
                  __html: props.superstate.ui.getSticker("lucide//type"),
                }}
              ></div>
            </>
          ) : (
            <></>
          )}

          {selectedNode.type == "content" || selectedNode.type == "group" ? (
            <>
              <div
                className="mk-mark"
                aria-label="Layers"
                onClick={(e) => showSelectNodeMenu(e)}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker("lucide//layers"),
                  }}
                ></div>
              </div>
              <div
                className="mk-mark"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditMode(HoverEditMode.EditModeLayout);
                }}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: props.superstate.ui.getSticker("lucide//layout"),
                  }}
                ></div>
              </div>
            </>
          ) : (
            <></>
          )}

          <div className="mk-divider"></div>
          <div
            className="mk-mark"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setEditMode(HoverEditMode.EditModeSpacing);
            }}
          >
            <div
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("lucide//fullscreen"),
              }}
            ></div>
          </div>
          <div className="mk-divider"></div>
          <div
            aria-label="Resize"
            className="mk-mark"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setEditMode(HoverEditMode.EditModeSize);
            }}
          >
            <div
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("lucide//scaling"),
              }}
            ></div>
          </div>
          {selectedNode.type == "image" || selectedNode.type == "icon" ? (
            <div
              aria-label="Image Size"
              className="mk-mark"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                showImageSizeMenu(e, selectedNode.type);
              }}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("lucide//type"),
              }}
            ></div>
          ) : (
            <></>
          )}
          <div
            className="mk-mark"
            aria-label="Page Width"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              saveStyleValue(
                "maxWidth",
                `${
                  removeQuotes(selectedNode.styles.maxWidth) == `100%`
                    ? ""
                    : `"100%"`
                }`
              );
            }}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//mk-ui-full-width"),
            }}
          ></div>
          <div className="mk-divider"></div>
          <div
            className="mk-mark"
            aria-label="Move Up"
            onClick={() => moveUp(selectedNode)}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("lucide//arrow-up"),
            }}
          ></div>
          <div
            className="mk-mark"
            aria-label="Move Down"
            onClick={() => moveDown(selectedNode)}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("lucide//arrow-down"),
            }}
          ></div>
          {selectedNode.type == "group" || selectedNode.type == "container" ? (
            <div
              aria-label="Ungroup"
              className="mk-mark"
              onClick={() => ungroupNode(selectedNode)}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("lucide//copy-x"),
              }}
            ></div>
          ) : (
            <div
              className="mk-mark"
              aria-label="Duplicate"
              onClick={() => duplicateFrame()}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("lucide//copy"),
              }}
            ></div>
          )}
          <div
            className="mk-mark"
            aria-label="Delete"
            onClick={() => deleteFrame()}
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("lucide//trash"),
            }}
          ></div>
        </>
      ) : editMode == HoverEditMode.EditModeText ? (
        <TextSubmenu {...submenuProps}></TextSubmenu>
      ) : editMode == HoverEditMode.EditModeLayout ? (
        <LayoutSubmenu {...submenuProps}></LayoutSubmenu>
      ) : editMode == HoverEditMode.EditModeSize ? (
        <SizeSubmenu {...submenuProps}></SizeSubmenu>
      ) : editMode == HoverEditMode.EditModeSpacing ? (
        <SpacingSubmenu {...submenuProps}></SpacingSubmenu>
      ) : (
        <></>
      )}
    </div>
  );
};
