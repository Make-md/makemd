import i18n from "shared/i18n";

import { FMMetadataKeys } from "core/types/space";
import { RepeatTemplate } from "core/utils/contexts/fields/presets";
import { nameForField } from "core/utils/frames/frames";
import { allPropertiesForPaths } from "core/utils/properties/allProperties";
import { SelectOption, SelectOptionType, Superstate } from "makemd-core";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { fieldTypeForType, fieldTypes, stickerForField } from "schemas/mdb";
import { defaultContextSchemaID } from "shared/schemas/context";
import { SpaceProperty, SpaceTableColumn } from "shared/types/mdb";
import { MenuObject } from "shared/types/menu";
import { Rect } from "shared/types/Pos";
import { windowFromDocument } from "shared/utils/dom";
import { folderPathToString } from "utils/path";
import { menuSeparator } from "../menu/SelectionMenu";
import { PropertyValueComponent } from "./PropertyValue";

export type NewPropertyMenuProps = {
  type?: string;
  spaces: string[];
  fields: SpaceTableColumn[];
  saveField: (source: string, field: SpaceProperty) => boolean;
  schemaId?: string;
  contextPath?: string;
  fileMetadata?: boolean;
  isSpace?: boolean;
};

const NewPropertyMenuComponent = (
  props: {
    superstate: Superstate;
    hide?: () => void;
    onSubmenu?: (
      openSubmenu: (offset: Rect, onHide: () => void) => MenuObject
    ) => void;
  } & NewPropertyMenuProps
) => {
  const [fieldName, setFieldName] = useState<string>("");
  const [fieldSource, setFieldSource] = useState<string>(
    props.fileMetadata ? "$fm" : ""
  );
  const spaceCaches = useMemo(
    () =>
      props.spaces
        .map((f) => props.superstate.spacesIndex.get(f))
        .filter((f) => f),
    [props.spaces]
  );
  const [fieldValue, setFieldValue] = useState<string>("");
  const [fieldType, setFieldType] = useState<string>(props.type ?? "text");
  const options = useMemo(() => {
    const options = [];
    if (props.fileMetadata) {
      options.push({
        name: i18n.menu.setNone,
        value: "$fm",
      });
    }
    if (
      props.contextPath &&
      (!props.fileMetadata || props.contextPath != "$fm")
    ) {
      options.push({
        name: folderPathToString(props.contextPath),
        value: "",
      });
    }
    options.push(
      ...(spaceCaches ?? []).map((f) => ({
        name: f.name,
        value: f.path,
      }))
    );
    return options;
  }, [spaceCaches]);

  const selectedType = (_: string[], value: string[]) => {
    setFieldType(value[0]);
  };
  const selectedValue = (value: string) => {
    setFieldValue(value);
  };
  const selectedSource = (_: string[], value: string[]) => {
    setFieldSource(value[0]);
  };
  const toggleMulti = () => {
    const field = fieldTypes.find(
      (f) => f.type == fieldType || f.multiType == fieldType
    );
    setFieldType(field.type == fieldType ? field.multiType : field.type);
  };

  const selectType = (e: React.MouseEvent) => {
    const specialMenu = (rect: Rect, onHide: () => void) => {
      const specialTypes = [RepeatTemplate];
      const options: SelectOption[] = specialTypes.map((f, i) => ({
        name: nameForField(f, props.superstate),
        value: f.name,
        icon: stickerForField(f),
        onClick: () => {
          props.saveField(fieldSource, {
            ...f,
            schemaId: props.schemaId,
          });
        },
      }));

      return props.superstate.ui.openMenu(
        rect,
        {
          ui: props.superstate.ui,
          multi: false,
          editable: false,
          searchable: true,
          value: [],
          showAll: true,
          options: options,
        },
        windowFromDocument(e.view.document)
      );
    };
    props.onSubmenu((rect: Rect, onHide: () => void) => {
      const options: SelectOption[] = [];
      fieldTypes
        .filter((f) =>
          fieldSource == "$fm" && !props.isSpace ? f.metadata : !f.restricted
        )
        .forEach((f, i) => {
          options.push({
            id: i + 1,
            name: f.label,
            value: f.type,
            icon: f.icon,
            description: f.description,
            onClick: () => setFieldType(f.type),
          });
        });
      options.push({
        name: "Special",
        value: "special",
        icon: "ui//edit",
        type: SelectOptionType.Submenu,
        onSubmenu: specialMenu,
      });
      return props.superstate.ui.openMenu(
        rect,
        {
          ui: props.superstate.ui,
          multi: false,
          editable: false,
          searchable: true,
          value: [],
          showAll: true,
          options: options,
        },
        windowFromDocument(e.view.document)
      );
    });
  };
  const selectedContext = (value: string) => {
    setFieldValue(value);
  };
  const type = useMemo(
    () => fieldTypeForType(fieldType, fieldName) ?? fieldTypes[0],
    [fieldType, fieldName]
  );
  const selectSource = (e: React.MouseEvent) => {
    e.stopPropagation();
    props.superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        searchable: false,
        saveOptions: selectedSource,
        value: [],
        showAll: true,
        options: options,
      },
      windowFromDocument(e.view.document)
    );
  };
  const saveField = () => {
    if (fieldName.length == 0) {
      props.superstate.ui.notify(i18n.notice.noPropertyName);
      return;
    }
    const result = props.saveField(fieldSource, {
      name: fieldName,
      type: fieldType,
      value: fieldValue,
      schemaId: props.schemaId,
    });
    if (result) props.hide();
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key == "Enter") {
      saveField();
    }
  };
  useEffect(() => {
    setTimeout(() => {
      input.current?.focus();
    }, 50);
  }, []);
  const input = useRef(null);
  const addExistingProperty = (e: React.MouseEvent) => {
    const source = fieldSource == "" ? props.contextPath : fieldSource;
    e.stopPropagation();
    const existingCols =
      props.superstate.contextsIndex.get(source)?.contextTable?.cols ?? [];
    const existingProps: SpaceProperty[] = allPropertiesForPaths(
      props.superstate,
      [...(props.superstate.spacesMap.getInverse(source) ?? [])]
    )
      .filter(
        (f) =>
          !existingCols.some((g) => g.name == f.name) &&
          ![
            ...FMMetadataKeys(props.superstate.settings),
            props.superstate.settings.fmKeyAlias,
            "tags",
          ].some((g) => g == f.name)
      )
      .map((f) => ({
        name: f.name,
        type: f.type,
        value: "",
        schemaId: props.schemaId,
      }));
    if (existingProps.length == 0) {
      props.superstate.ui.notify(i18n.notice.noPropertiesFound);
      return;
    }
    props.superstate.ui.openMenu(
      (e.target as HTMLElement).getBoundingClientRect(),
      {
        ui: props.superstate.ui,
        multi: false,
        editable: false,
        searchable: true,
        saveOptions: (_: string[], value: any[]) => {
          if (value[0] == "all") {
            props.superstate.spaceManager
              .readTable(source, defaultContextSchemaID)
              .then((f) => {
                props.superstate.spaceManager.saveTable(
                  source,
                  {
                    ...f,
                    cols: [...f.cols, ...existingProps],
                  },
                  true
                );
              })
              .then((f) => props.superstate.reloadContextByPath(source, true));
            props.hide();
            return;
          }
          const result = props.saveField(fieldSource, value[0]);
          if (result) props.hide();
        },
        value: [],
        showAll: true,
        options: [
          { name: i18n.labels.all, value: "all", icon: "ui//plus" },
          menuSeparator,
          ...existingProps.map((f, i) => ({
            id: i + 1,
            name: f.name,
            value: f,
            icon: stickerForField(f),
          })),
        ],
        placeholder: i18n.labels.existingFrontmatter,
      },
      windowFromDocument(e.view.document)
    );
  };

  return (
    <div className="mk-menu-container">
      <div className="mk-menu-suggestions">
        <div className="mk-menu-input">
          <input
            type="text"
            ref={input}
            placeholder="Name"
            onKeyDown={onKeyDown}
            onChange={(e) => setFieldName(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            value={fieldName}
          />
          {fieldSource != "$fm" && (
            <button
              aria-label={i18n.labels.existingFrontmatter}
              className="mk-toolbar-button"
              onClick={(e) => addExistingProperty(e)}
              dangerouslySetInnerHTML={{
                __html: props.superstate.ui.getSticker("ui//import"),
              }}
            ></button>
          )}
        </div>

        <div className="mk-menu-separator"></div>
        {options.length > 1 && (
          <div className="mk-menu-option" onClick={(e) => selectSource(e)}>
            <div className="mk-menu-options-inner">
              {i18n.labels.propertyValueSpace}
            </div>
            <span>
              {fieldSource == "$fm"
                ? "None"
                : fieldSource == ""
                ? props.superstate.spacesIndex.get(props.contextPath)?.name
                : props.superstate.spacesIndex.get(fieldSource)?.name}
            </span>
          </div>
        )}

        <div className="mk-menu-option" onClick={(e) => selectType(e)}>
          <div className="mk-menu-options-inner">
            {i18n.labels.propertyType}
          </div>
          <span>{type.label}</span>
        </div>
        {type.multi ? (
          <div className="mk-menu-option">
            <span>{i18n.labels.multiple}</span>
            <input
              type="checkbox"
              checked={fieldType == type.multiType}
              onChange={() => toggleMulti()}
            ></input>
          </div>
        ) : (
          <></>
        )}
        <div className="mk-menu-separator"></div>
        {fieldSource != "$fm" || props.isSpace ? (
          <PropertyValueComponent
            superstate={props.superstate}
            table={fieldSource}
            fields={props.fields}
            fieldType={fieldType}
            value={fieldValue}
            contextPath={props.contextPath}
            saveValue={selectedValue}
          ></PropertyValueComponent>
        ) : (
          <></>
        )}
        <div className="mk-menu-separator"></div>
        <div className="mk-menu-option" onClick={(e) => saveField()}>
          <span>{i18n.buttons.saveProperty}</span>
        </div>
        <div className="mk-menu-option" onClick={(e) => props.hide()}>
          <span>{i18n.buttons.cancel}</span>
        </div>
      </div>
    </div>
  );
};

export const showNewPropertyMenu = (
  superstate: Superstate,
  rect: Rect,
  win: Window,
  props: NewPropertyMenuProps,
  onHide?: () => void,
  isSubmenu?: boolean
) => {
  return superstate.ui.openCustomMenu(
    rect,
    <NewPropertyMenuComponent
      superstate={superstate}
      {...props}
    ></NewPropertyMenuComponent>,
    {},
    win,
    null,
    onHide
  );
};
