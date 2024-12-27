import {
  defaultMenu,
  menuSeparator,
} from "core/react/components/UI/Menus/menu/SelectionMenu";
import { parseFieldValue } from "core/schemas/parseFieldValue";

import classNames from "classnames";
import { getContextProperties } from "core/utils/contexts/context";
import {
  parseLinkedNode,
  parseLinkedPropertyToValue,
} from "core/utils/frames/frame";
import {
  nameForField,
  objectIsConst,
  removeTrailingSemicolon,
  stringIsConst,
} from "core/utils/frames/frames";
import { removeQuotes, wrapQuotes } from "core/utils/strings";
import { SelectOption, i18n } from "makemd-core";
import React from "react";
import { stickerForField } from "schemas/mdb";
import { FrameRunInstance } from "shared/types/frameExec";
import { SpaceProperty } from "shared/types/mdb";
import { PathState } from "shared/types/PathState";
import { windowFromDocument } from "shared/utils/dom";
import { propertyIsObjectType } from "utils/properties";
import { PropertyField } from "../../../Contexts/ContextBuilder/ContextListEditSelector";
import { DataPropertyView } from "../../../Contexts/DataTypeView/DataPropertyView";
import { PropertySelectCell } from "../../../Contexts/DataTypeView/PropertySelectCell";
import { CellEditMode } from "../../../Contexts/TableView/TableView";
import { HoverSubmenuProps } from "./HoverSubmenuProps";

export const PropertiesSubmenu = (
  props: HoverSubmenuProps & {
    pathState: PathState;
    frameProperties: SpaceProperty[];
    instance: FrameRunInstance;
    hide?: () => void;
  }
) => {
  const {
    selectedNode,
    pathState,
    savePropValue,
    frameProps,
    fields,
    frameProperties,
    instance,
  } = props;

  const showPropsMenu = (e: React.MouseEvent, field: SpaceProperty) => {
    e.preventDefault();

    const isStaticProperty = stringIsConst(frameProps?.[field.name]);
    const menuOptions: SelectOption[] = [];
    if (!isStaticProperty) {
      menuOptions.push({
        name: i18n.editor.unlinkProperty,
        icon: "ui//unplug",
        onClick: () => {
          savePropValue(
            field.name,
            wrapQuotes(props.state.props?.[field.name])
          );
        },
      });
      menuOptions.push(menuSeparator);
    }

    const compatibleTypes: string[] = [field.type];
    compatibleTypes.push("fileprop");
    if (
      field.type == "image" ||
      field.type == "link" ||
      field.type == "context"
    ) {
      compatibleTypes.push("file");
      compatibleTypes.push("link");
      compatibleTypes.push("image");
      compatibleTypes.push("context");
    }
    const defaultContextName = (name: string) => {
      if (name == "$space") return i18n.editor.currentSpace;
      return name;
    };
    Object.keys(instance.state.$contexts).forEach((c) => {
      getContextProperties(props.superstate, c).forEach((g) => {
        if (
          c != instance.state.$contexts?.$context?._path &&
          g.primary == "true"
        )
          return;
        if (compatibleTypes.includes(g.type)) {
          menuOptions.push({
            name: nameForField(g, props.superstate),
            icon: stickerForField(g),
            description: defaultContextName(c),
            onClick: () => {
              savePropValue(field.name, `$contexts['${c}']['${g.name}']`);
            },
          });
        }
        if (g.type == "link" || g.type == "image" || g.type == "file") {
          if (field.type == "icon")
            menuOptions.push({
              name: `${nameForField(g, props.superstate)} Sticker`,
              icon: stickerForField(g),
              description: defaultContextName(c),
              onClick: () => {
                savePropValue(
                  field.name,
                  `$api.path.label($contexts['${c}']['${g.name}'])?.sticker`
                );
              },
            });
          if (field.type == "text")
            menuOptions.push({
              name: i18n.editor.linkName.replace(
                "${1}",
                nameForField(g, props.superstate)
              ),
              icon: stickerForField(g),
              description: defaultContextName(c),
              onClick: () => {
                savePropValue(
                  field.name,
                  `$api.path.label($contexts['${c}']['${g.name}'])?.name`
                );
              },
            });
          if (field.type == "image")
            menuOptions.push({
              name: i18n.editor.linkThumbnail.replace(
                "${1}",
                nameForField(g, props.superstate)
              ),
              icon: stickerForField(g),
              description: defaultContextName(c),
              onClick: () => {
                savePropValue(
                  field.name,
                  `$api.path.label($contexts['${c}']['${g.name}'])?.thumbnail`
                );
              },
            });
        }
      });
      menuOptions.push(menuSeparator);
    });

    frameProperties
      .filter((f) => compatibleTypes.some((g) => g == f.type))
      .forEach((f) => {
        menuOptions.push({
          name: f.name,
          icon: stickerForField(f),
          onClick: () => {
            savePropValue(field.name, `${f.schemaId}.props['${f.name}']`);
          },
        });
      });
    menuOptions.push(menuSeparator);
    frameProperties
      .filter((f) => f.type != field.type)
      .forEach((g) => {
        if (g.type == "link" || g.type == "image" || g.type == "file") {
          if (field.type == "icon")
            menuOptions.push({
              name: i18n.editor.linkSticker.replace(
                "${1}",
                nameForField(g, props.superstate)
              ),
              icon: stickerForField(g),
              onClick: () => {
                savePropValue(
                  field.name,
                  `$api.path.label(${g.schemaId}.props['${g.name}'])?.sticker`
                );
              },
            });
          if (field.type == "image")
            menuOptions.push({
              name: i18n.editor.linkThumbnail.replace("${1}", g.name),
              icon: stickerForField(g),
              onClick: () => {
                savePropValue(
                  field.name,
                  `$api.path.label(${g.schemaId}.props['${g.name}'])?.thumbnail`
                );
              },
            });
        }
        if (field.type == "text" && (g.type == "link" || g.type == "file"))
          menuOptions.push({
            name: i18n.editor.linkName.replace(
              "${1}",
              nameForField(g, props.superstate)
            ),
            icon: stickerForField(g),
            onClick: () => {
              savePropValue(
                field.name,
                `$api.path.label(${g.schemaId}.props['${g.name}'])?.name`
              );
            },
          });
      });
    const offset = (e.target as HTMLElement).getBoundingClientRect();
    props.superstate.ui.openMenu(
      offset,
      defaultMenu(props.superstate.ui, menuOptions),
      windowFromDocument(e.view.document),
      "bottom"
    );
  };

  const propertyForField = (field: string) => {
    const f = frameProperties?.find(
      (p) => p.name == parseLinkedNode(frameProps?.[field])?.prop
    );

    return f;
  };
  const valueForField = (field: SpaceProperty, value: string): string => {
    if (!field || !value) return null;
    if (field.type.startsWith("object")) {
      return removeTrailingSemicolon(value);
    }
    if (field.type == "option") {
      const parsedValue = parseFieldValue(
        field.value,
        field.type,
        props.superstate,
        pathState.path
      );

      const options: SelectOption[] = parsedValue.options ?? [];
      return options.find((f) => f.value == removeQuotes(value))?.name ?? null;
    }
    if (field.type == "super") {
      const parsedValue = parseFieldValue(
        field.value,
        field.type,
        props.superstate
      );
      const superPropertyName = parsedValue.dynamic
        ? removeQuotes(frameProps[parsedValue.field ?? ""])
        : parsedValue.field;

      if (superPropertyName) {
        return value;
      }
    }
    return stringIsConst(value) ? removeQuotes(value) : null;
  };
  const stackedProperty = (field: SpaceProperty) => {
    return field.type.startsWith("object") || field.type == "super";
  };
  return (
    <div className="mk-editor-frame-properties">
      <div className="mk-editor-actions-name">
        <div className="mk-editor-actions-name-icon">
          <div
            className="mk-icon-small"
            dangerouslySetInnerHTML={{
              __html: props.superstate.ui.getSticker("ui//list"),
            }}
          ></div>
        </div>
        <div className="mk-editor-actions-name-text">
          {i18n.buttons.editProperty}
        </div>
        <span></span>
        <div
          className="mk-icon-small mk-inline-button"
          dangerouslySetInnerHTML={{
            __html: props.superstate.ui.getSticker("ui//close"),
          }}
          onClick={() => props.hide()}
        ></div>
      </div>
      <div className="mk-props-contexts">
        {fields.map((f, i) => {
          const isStaticProperty = f.type.startsWith("object")
            ? objectIsConst(frameProps?.[f.name], f.type)
            : f.type == "super" || stringIsConst(frameProps?.[f.name]);
          const isStacked = stackedProperty(f);
          return (
            <React.Fragment key={i}>
              {isStaticProperty ? (
                <DataPropertyView
                  initialValue={valueForField(f, frameProps?.[f.name])}
                  column={f}
                  compactMode={false}
                  superstate={props.superstate}
                  editMode={CellEditMode.EditModeValueOnly}
                  row={props.state?.props}
                  updateValue={(value: string) => {
                    if (propertyIsObjectType(f)) {
                      savePropValue(f.name, value);
                    } else {
                      savePropValue(f.name, wrapQuotes(value));
                    }
                  }}
                  linkProp={(e) => showPropsMenu(e, f)}
                  source={pathState.path}
                  columns={frameProperties}
                ></DataPropertyView>
              ) : (
                <div
                  className={classNames(
                    "mk-path-context-row",
                    isStacked && "mk-path-context-stacked"
                  )}
                >
                  {f.type == "input" ? (
                    <PropertySelectCell
                      initialValue={frameProps?.[f.name]}
                      superstate={props.superstate}
                      compactMode={true}
                      property={f}
                      editMode={CellEditMode.EditModeValueOnly}
                      saveValue={(value: string) =>
                        savePropValue(f.name, wrapQuotes(value))
                      }
                      columns={frameProperties}
                    ></PropertySelectCell>
                  ) : (
                    <>
                      <PropertyField
                        path={pathState.path}
                        superstate={props.superstate}
                        property={f}
                        draggable={true}
                      ></PropertyField>
                      <div className="mk-active">
                        <div aria-label={i18n.editor.linkedProperty}>
                          {parseLinkedPropertyToValue(frameProps?.[f.name])}
                        </div>
                      </div>
                    </>
                  )}
                  <span></span>
                  {!isStacked && (
                    <div
                      aria-label={i18n.editor.linkProperty}
                      className="mk-icon-small mk-inline-button"
                      onClick={(e) => showPropsMenu(e, f)}
                      dangerouslySetInnerHTML={{
                        __html: props.superstate.ui.getSticker("ui//plug"),
                      }}
                    ></div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
